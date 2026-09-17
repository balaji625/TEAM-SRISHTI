/**
 * healthRecordController — CarePath AI
 *
 * Structured health record CRUD for USER.
 *
 * GET    /api/user/history         — list health records
 * POST   /api/user/history         — create health record
 * GET    /api/user/history/:id     — get single record
 * PUT    /api/user/history/:id     — update record
 * DELETE /api/user/history/:id     — delete record
 */

'use strict';

const { validationResult } = require('express-validator');
const { HealthRecord } = require('../models');
const { success, fail } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

const listRecords = async (req, res, next) => {
  try {
    const { recordType, page = 1, limit = 30 } = req.query;
    const filter = { userId: req.user.sub };
    if (recordType) filter.recordType = recordType;

    const records = await HealthRecord.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await HealthRecord.countDocuments(filter);
    return success(res, { records, total, page: Number(page) }, 'Health records retrieved');
  } catch (err) {
    next(err);
  }
};

const createRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, errors.array()[0].msg, 400,
        errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { recordType, title, description, values, source, date, visibility } = req.body;
    const record = await HealthRecord.create({
      userId: req.user.sub,
      recordType, title,
      description: description || null,
      values: values || [],
      source: source || null,
      date: date || Date.now(),
      visibility: visibility || 'PRIVATE',
    });

    return success(res, { record }, 'Health record created', 201);
  } catch (err) {
    next(err);
  }
};

const getRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!record) return next(new AppError('Record not found', 404));
    return success(res, { record }, 'Record retrieved');
  } catch (err) {
    next(err);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'values', 'source', 'date', 'visibility'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const record = await HealthRecord.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!record) return next(new AppError('Record not found', 404));
    return success(res, { record }, 'Record updated');
  } catch (err) {
    next(err);
  }
};

const deleteRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
    if (!record) return next(new AppError('Record not found', 404));
    return success(res, {}, 'Record deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { listRecords, createRecord, getRecord, updateRecord, deleteRecord };
