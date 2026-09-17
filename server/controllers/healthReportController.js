/**
 * healthReportController — CarePath AI
 *
 * Full health report upload, AI analysis, and retrieval.
 *
 * POST   /api/user/reports          — upload & analyse a report
 * GET    /api/user/reports          — list own reports
 * GET    /api/user/reports/:id      — get a single report
 * DELETE /api/user/reports/:id      — delete a report
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { HealthReport } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError }      = require('../middleware/errorHandler');

// ── Detect file type string from MIME ─────────────────────────────────────────
const mimeToFileType = (mime) => {
  if (mime === 'application/pdf')  return 'PDF';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'JPEG';
  if (mime === 'image/png')        return 'PNG';
  if (mime.includes('wordprocessingml')) return 'DOCX';
  if (mime === 'text/plain')       return 'TXT';
  return 'OTHER';
};

// ── Extract text from plain-text and TXT files ────────────────────────────────
const extractText = (filePath, mimeType) => {
  if (mimeType === 'text/plain') {
    try {
      return fs.readFileSync(filePath, 'utf8').slice(0, 8000);
    } catch (_) { return null; }
  }
  return null;
};

// ── AI Analysis via Gemini ────────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const analyseWithGemini = async (fileName, extractedText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  const prompt = extractedText
    ? `You are a medical AI assistant helping patients understand their health reports.\n\nAnalyse the following health report text extracted from "${fileName}":\n\n---\n${extractedText.slice(0, 4000)}\n---\n\nProvide:\n1. A plain-language summary of what this report shows (2-3 sentences)\n2. Key findings in bullet points\n3. Any values that appear outside normal range (flag them)\n4. What the patient should discuss with their doctor\n\nAlways end with: "⚠️ This is an AI-generated explanation for informational purposes only and is NOT a medical diagnosis. Please discuss these results with your healthcare provider."`
    : `You are a medical AI assistant helping patients understand their health reports.\n\nA patient has uploaded a health report file named: "${fileName}"\n\nSince we cannot read the file content directly, provide:\n1. General guidance on what this type of report typically shows\n2. Questions the patient should ask their doctor about this report\n3. How to read common values in this type of report\n\nAlways end with: "⚠️ This is an AI-generated explanation for informational purposes only and is NOT a medical diagnosis. Please discuss your actual results with your healthcare provider."`;

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
  });

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
  } catch (_) {
    return null;
  }
};

// ── Fallback analysis (no API key) ────────────────────────────────────────────
const fallbackAnalysis = (fileName) => {
  const lower = fileName.toLowerCase();
  let type = 'health document';
  if (lower.includes('blood') || lower.includes('cbc') || lower.includes('haemo')) type = 'blood test report';
  else if (lower.includes('urine') || lower.includes('urin')) type = 'urine analysis report';
  else if (lower.includes('xray') || lower.includes('x-ray') || lower.includes('chest')) type = 'radiology report';
  else if (lower.includes('ecg') || lower.includes('ekg')) type = 'ECG/heart rhythm report';
  else if (lower.includes('thyroid') || lower.includes('tsh')) type = 'thyroid function report';
  else if (lower.includes('lipid') || lower.includes('cholesterol')) type = 'lipid profile report';
  else if (lower.includes('sugar') || lower.includes('glucose') || lower.includes('hba1c')) type = 'blood glucose/diabetes report';
  else if (lower.includes('prescription')) type = 'prescription document';

  return `Your ${type} has been uploaded successfully.\n\n**What you should do:**\n• Share this report with your treating doctor for proper interpretation\n• Keep a copy for your health records\n• Note any values flagged as high (H), low (L), or outside normal range\n• Ask your doctor what the results mean for your specific condition\n\n**Common things to look for:**\n• Reference ranges are usually shown next to each value\n• Values marked H (high) or L (low) need your doctor's attention\n• Results should always be interpreted in context of your symptoms and history\n\n⚠️ This is an AI-generated explanation for informational purposes only and is NOT a medical diagnosis. Please discuss these results with your healthcare provider.`;
};

// ── POST /api/user/reports ────────────────────────────────────────────────────
const uploadReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return fail(res, 'No file uploaded. Please select a file to upload.', 400);
    }

    const { consentGiven } = req.body;
    const hasConsent = consentGiven === 'true' || consentGiven === true;

    // ── Duplicate detection: check if same filename was already uploaded today ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingByName = await HealthReport.findOne({
      userId: req.user.sub,
      fileName: req.file.originalname,
      createdAt: { $gte: today },
    });
    if (existingByName) {
      // Clean up the just-uploaded temp file
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return fail(
        res,
        `A report named "${req.file.originalname}" was already uploaded today. Please verify if this is a duplicate before re-uploading.`,
        409,
        [{ field: 'file', message: 'Duplicate report detected', existingId: existingByName._id }]
      );
    }

    const fileType    = mimeToFileType(req.file.mimetype);
    const fileUrl     = `/uploads/reports/${req.file.filename}`;
    const filePath    = req.file.path;
    const extractedText = extractText(filePath, req.file.mimetype);

    // AI analysis
    let aiSummary = null;
    let aiSource  = 'none';

    if (hasConsent) {
      const geminiResult = await analyseWithGemini(req.file.originalname, extractedText);
      if (geminiResult) {
        aiSummary = geminiResult;
        aiSource  = 'gemini';
      } else {
        aiSummary = fallbackAnalysis(req.file.originalname);
        aiSource  = 'smart-engine';
      }
    }

    const report = await HealthReport.create({
      userId:       req.user.sub,
      fileName:     req.file.originalname,
      fileUrl,
      fileType,
      fileSize:     req.file.size,
      ocrText:      extractedText,
      consentGiven: hasConsent,
      summary:      aiSummary,
      analysis: hasConsent ? {
        plainLanguageSummary: aiSummary,
        flaggedItems:         [],
        disclaimer:           '⚠️ This is an AI-generated explanation for informational purposes only and is NOT a medical diagnosis.',
        generatedAt:          new Date(),
      } : undefined,
    });

    return success(res, { report, aiSource }, 'Report uploaded and analysed successfully', 201);
  } catch (err) {
    // Clean up uploaded file on DB error
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
};

// ── GET /api/user/reports ─────────────────────────────────────────────────────
const listReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const filter = { userId: req.user.sub };

    const reports = await HealthReport.find(filter)
      .select('-ocrText -accessLog')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await HealthReport.countDocuments(filter);
    return success(res, { reports, total, page: Number(page) }, 'Reports retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/user/reports/:id ─────────────────────────────────────────────────
const getReport = async (req, res, next) => {
  try {
    const report = await HealthReport.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!report) return next(new AppError('Report not found', 404));

    // Log access
    report.accessLog.push({ accessedBy: req.user.sub, accessedAt: new Date(), action: 'VIEW' });
    await report.save();

    return success(res, { report }, 'Report retrieved');
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/user/reports/:id ──────────────────────────────────────────────
const deleteReport = async (req, res, next) => {
  try {
    const report = await HealthReport.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!report) return next(new AppError('Report not found', 404));

    // Delete file from disk
    if (report.fileUrl) {
      const filePath = path.join(__dirname, '..', report.fileUrl);
      try { fs.unlinkSync(filePath); } catch (_) {}
    }

    await report.deleteOne();
    return success(res, {}, 'Report deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadReport, listReports, getReport, deleteReport };
