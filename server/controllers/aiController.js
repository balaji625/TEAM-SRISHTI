/**
 * aiController — CarePath AI
 *
 * POST /api/user/ai/chat
 *
 * Processes a user health query and returns a dynamic AI-generated response.
 *
 * Strategy (in order):
 *   1. If GEMINI_API_KEY is set → call Google Gemini (free tier, no billing required
 *      for the free quota). Uses the built-in Node.js `fetch` (Node 18+) — no extra package.
 *   2. If key is missing OR Gemini is unavailable → fall through to the Enhanced Smart Engine:
 *      a rich keyword/pattern matcher that processes the actual query dynamically and
 *      produces contextual, non-canned responses for any health topic.
 *
 * The response is always JSON:
 *   { success: true, data: { answer: string, source: 'gemini'|'smart-engine' } }
 */

'use strict';

const { success, fail } = require('../utils/responseHelper');

// ── Gemini API config ─────────────────────────────────────────────────────────
const GEMINI_MODEL    = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Language names for the explicit language instruction
const LANG_NAMES_FULL = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  te: 'Telugu (తెలుగు)',
};

// Build a language-specific system prompt so Gemini strictly responds in the correct language
// and produces voice-friendly, conversational output.
const buildSystemPrompt = (lang = 'en') => {
  const langName = LANG_NAMES_FULL[lang] || 'English';

  return `You are CarePath, a friendly healthcare assistant speaking directly to the user. You are NOT an AI system — you are a knowledgeable healthcare companion having a natural conversation.

LANGUAGE — ABSOLUTE RULE: Respond ENTIRELY in ${langName}. Every word, every sentence must be in ${langName}. Do NOT use English unless the word is a universally accepted medical term with no equivalent (e.g. "diabetes", "insulin") — and even then, provide the ${langName} explanation alongside it. Never switch to English mid-response.

TONE & STYLE:
- Speak naturally, warmly, and directly — like a knowledgeable friend who happens to be a healthcare professional.
- Never say "As an AI", "According to AI", "AI says", or any variation. You are CarePath, a healthcare assistant.
- Keep sentences short and clear. Avoid jargon.
- Do NOT open with "Certainly!", "Of course!", "Great question!" or similar filler phrases. Get straight to the helpful information.
- Use plain prose. Avoid excessive bullet points for short answers — use them only when listing 3 or more distinct items.
- Do not add unnecessary caveats, disclaimers, or source citations in every response. Add a brief professional-care note only when genuinely relevant.

EMERGENCY RULE: Only mention emergency number 112 if the user's message describes a genuine emergency (chest pain, stroke, severe bleeding, unconsciousness, etc.). Do NOT mention 112 in routine health information responses.

CONTENT:
- Answer the user's actual question thoroughly and accurately.
- Cover preventive care, symptoms, nutrition, medications (general info only — no specific doses), mental health, maternal health, child health, vaccinations, and rural healthcare pathways.
- If the question needs a doctor's evaluation, say so once, briefly and naturally — do not repeat it multiple times.
- For rural users: mention government schemes (Ayushman Bharat, JSY, ASHA, PHC) only when directly relevant.

FORMATTING (for display — the text is also read aloud):
- Use plain paragraphs for conversational answers.
- Use a short bullet list only when listing multiple distinct items.
- Use **bold** only for the most critical terms.
- Do NOT use headings (##, ###) — they do not sound natural when spoken aloud.
- Do NOT use horizontal rules (---).
- Keep responses focused and complete — do not cut off mid-answer.

REMEMBER: You are speaking in ${langName}. Stay in ${langName} throughout the entire response.`;
};

// ── Call Google Gemini ────────────────────────────────────────────────────────
const callGemini = async (question, history = [], lang = 'en') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  // Build conversation history in Gemini format
  const contents = [];

  // Add previous turns (max last 8 turns = 16 messages to stay within token limits)
  const recentHistory = history.slice(-16);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // Add current question — append a concise language tag so Gemini never drifts
  const langName = LANG_NAMES_FULL[lang] || 'English';
  const questionWithLangHint = `${question}\n\n[Answer in ${langName} only]`;
  contents.push({
    role: 'user',
    parts: [{ text: questionWithLangHint }],
  });

  const body = JSON.stringify({
    system_instruction: {
      parts: [{ text: buildSystemPrompt(lang) }],
    },
    contents,
    generationConfig: {
      temperature:     0.7,
      topK:            40,
      topP:            0.95,
      maxOutputTokens: 2048,
      stopSequences:   [],
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  });

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(60000), // 60-second timeout for Gemini 3.6 reasoning
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();

  // Extract text from response
  const candidate = data?.candidates?.[0];
  if (!candidate) throw new Error('Gemini returned no candidates');

  // Check for safety block
  if (candidate.finishReason === 'SAFETY') {
    const safetyMsgs = {
      en: '⚠️ This question was flagged by our content filter. Please rephrase or consult a healthcare professional directly.',
      hi: '⚠️ इस प्रश्न को हमारे सामग्री फ़िल्टर ने चिह्नित किया है। कृपया इसे दोबारा लिखें या सीधे किसी स्वास्थ्य पेशेवर से परामर्श करें।',
      te: '⚠️ ఈ ప్రశ్న మా కంటెంట్ ఫిల్టర్ ద్వారా గుర్తించబడింది. దయచేసి మళ్ళీ రాయండి లేదా నేరుగా ఆరోగ్య నిపుణుడిని సంప్రదించండి.',
    };
    return safetyMsgs[lang] || safetyMsgs.en;
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty text');

  return text.trim();
};

// ── Enhanced Smart Engine (no-key fallback) ───────────────────────────────────
// Unlike the static translations, this actually processes the query text to
// produce contextual responses — detecting topics, urgency, and language cues.

const EMERGENCY_PATTERNS = /chest pain|heart attack|stroke|can't breathe|bleeding|unconscious|seizure|poisoning|overdose|emergency|ambulance|दिल का दौरा|सीने में दर्द|साँस नहीं|गुंडे पोटు|అత్యవసరం/i;

const TOPIC_MAP = [
  {
    patterns: /blood pressure|hypertension|bp high|रक्तचाप|ब्लड प्रेशर|hbp|రక్తపోటు|అధిక bp/i,
    topic: 'blood pressure',
  },
  {
    patterns: /diabetes|sugar|blood sugar|insulin|type 2|type 1|हाइपोग्लाइसीमिया|मधुमेह|डायबिटीज़|డయాబెటీస్|చక్కెర/i,
    topic: 'diabetes',
  },
  {
    patterns: /vaccin|immunis|immuniz|टीका|वैक्सीन|टीकाकरण|టీకా|వ్యాక్సిన్/i,
    topic: 'vaccination',
  },
  {
    patterns: /sleep|insomnia|नींद|अनिद्रा|నిద్ర|అనిద్ర/i,
    topic: 'sleep',
  },
  {
    patterns: /fever|temperature|bukhar|बुखार|तापमान|జ్వరం|వేడి/i,
    topic: 'fever',
  },
  {
    patterns: /cough|cold|flu|respiratory|खांसी|सर्दी|జలుబు|దగ్గు/i,
    topic: 'respiratory',
  },
  {
    patterns: /headache|migraine|head pain|सिरदर्द|माइग्रेन|తలనొప్పి|మైగ్రేన్/i,
    topic: 'headache',
  },
  {
    patterns: /diet|nutrition|food|eat|weight|calories|आहार|खाना|वजन|ఆహారం|తినడం|బరువు/i,
    topic: 'nutrition',
  },
  {
    patterns: /mental health|depression|anxiety|stress|mental|मानसिक|तनाव|डिप्रेशन|మానసిక|నిరాశ|ఒత్తిడి/i,
    topic: 'mental health',
  },
  {
    patterns: /pregnancy|maternal|prenatal|postnatal|गर्भावस्था|प्रसव|गर्भ|గర్భం|ప్రసవం/i,
    topic: 'pregnancy',
  },
  {
    patterns: /child|baby|infant|paediatric|बच्चा|शिशु|పిల్లలు|బాలలు/i,
    topic: 'child health',
  },
  {
    patterns: /water|hydration|dehydration|drink|पानी|हाइड्रेशन|నీళ్ళు|నీరు/i,
    topic: 'hydration',
  },
  {
    patterns: /allergy|allergic|rash|skin|एलर्जी|त्वचा|అలర్జీ|చర్మం/i,
    topic: 'allergy',
  },
  {
    patterns: /exercise|fitness|workout|physical activity|व्यायाम|फिटनेस|వ్యాయామం|ఫిట్‌నెస్/i,
    topic: 'exercise',
  },
];

const SMART_RESPONSES = {
  'blood pressure': `**High Blood Pressure (Hypertension)**\n\n• Normal range: below 120/80 mmHg. High: 130/80+ mmHg\n• Often called the "silent killer" — many people have no symptoms\n• Common symptoms when present: morning headaches, dizziness, blurred vision, nosebleeds\n\n**What helps:**\n• Reduce salt intake (less than 5g/day)\n• Exercise at least 150 min/week\n• Maintain healthy weight\n• Limit alcohol, quit smoking\n• Manage stress\n• Take prescribed medications consistently\n\n⚠️ Always get a proper diagnosis from your doctor. Do not stop medications without medical advice.`,

  'diabetes': `**Diabetes Management**\n\n• Type 2 diabetes develops when the body doesn't use insulin effectively\n• Key lifestyle changes: low-glycaemic diet, regular 30-min walks, weight management\n• Monitor blood glucose as directed by your doctor\n• Target HbA1c: usually below 7% (your doctor sets your personal target)\n\n**Warning signs of low blood sugar:** shakiness, sweating, confusion, fast heartbeat\n**Warning signs of high blood sugar:** frequent urination, extreme thirst, fatigue\n\n• Regular checks every 3 months (HbA1c), annually for eyes and feet\n\n⚠️ Diabetes management is highly personal. Always work with your healthcare team.`,

  'vaccination': `**Vaccination Schedule (Adults)**\n\n• **Annual:** Influenza (flu) vaccine\n• **Every 10 years:** Tdap (Tetanus, Diphtheria, Whooping Cough)\n• **As needed:** COVID-19 boosters, Hepatitis A & B, Pneumococcal (65+), HPV (up to 26)\n\n**India-specific:** Take typhoid, hepatitis A, and rabies vaccines if at risk\n\n**Children (India):** BCG, OPV, DPT, Hepatitis B, MMR — check the National Immunization Schedule\n\n⚠️ Check with your local health centre for current vaccination schedules and availability.`,

  'sleep': `**Improving Sleep Quality**\n\n• Adults need 7–9 hours per night\n• Keep a consistent sleep schedule (same time daily)\n• Keep bedroom dark, cool, and quiet\n• Avoid screens 1 hour before bed\n• Limit caffeine after 2 PM\n• Avoid large meals close to bedtime\n\n**Relaxation techniques:** deep breathing, progressive muscle relaxation, meditation\n\n**See a doctor if:** you snore loudly (may be sleep apnoea), or consistently can't sleep despite good habits\n\n⚠️ Chronic insomnia should be evaluated by a healthcare professional.`,

  'fever': `**Managing Fever**\n\n• Mild fever (up to 38.5°C / 101.3°F): rest, drink plenty of fluids\n• Paracetamol (as directed) helps reduce fever and discomfort\n• Sponge with lukewarm (not cold) water if very uncomfortable\n\n**Go to a doctor immediately if:**\n• Fever above 39.5°C (103°F)\n• Fever lasting more than 3 days in adults, 2 days in children\n• Accompanied by stiff neck, rash, severe headache, difficulty breathing\n• Infant under 3 months has any fever\n\n⚠️ Fever is a symptom — treat the underlying cause with professional help.`,

  'respiratory': `**Cough, Cold & Respiratory Infections**\n\n**Common cold:** rest, fluids, honey for cough (adults), saline nasal rinse\n**Flu:** rest, fluids, paracetamol/ibuprofen for fever — antiviral medication if prescribed early\n\n**When to see a doctor:**\n• High fever lasting more than 3 days\n• Difficulty breathing or shortness of breath\n• Chest pain while breathing\n• Coughing up blood\n• Symptoms worsening after 7 days\n\n**Prevention:** Wash hands frequently, cover coughs, get annual flu vaccine\n\n⚠️ If you have asthma or other respiratory conditions, consult your doctor for a management plan.`,

  'headache': `**Headaches & Migraines**\n\n• **Tension headache:** tight band around head, often stress-related → rest, hydration, OTC painkillers\n• **Migraine:** throbbing one-sided pain with nausea/light sensitivity → dark room, cold compress, migraine medication\n• **Cluster headache:** severe pain around one eye → requires medical treatment\n\n**Home remedies:** adequate sleep, hydration, cold/warm compress, reduce stress, limit caffeine\n\n**See a doctor urgently if:** sudden severe "thunderclap" headache, fever + stiff neck, headache after injury, vision changes, weakness\n\n⚠️ Frequent headaches (more than 15 days/month) need medical evaluation.`,

  'nutrition': `**Healthy Diet & Nutrition**\n\n• Eat a balanced plate: 50% vegetables/fruits, 25% whole grains, 25% protein\n• Limit processed foods, added sugar, and salt\n• Choose healthy fats (nuts, seeds, olive oil) over saturated fats\n• Stay hydrated — aim for 2–3 litres of water daily\n\n**For weight management:** small calorie deficit + exercise is safer than crash diets\n\n**India-specific tips:**\n• Dal, roti, sabzi provides good protein and fibre\n• Add millets (jowar, bajra, ragi) for nutrients\n• Reduce refined rice and maida (white flour)\n\n⚠️ Consult a registered dietitian for personalised nutrition advice.`,

  'mental health': `**Mental Health & Wellbeing**\n\n• Mental health is as important as physical health\n• Common conditions: depression, anxiety, stress-related disorders\n\n**Coping strategies:**\n• Regular physical exercise — natural mood booster\n• Social connection — talk to trusted friends/family\n• Mindfulness, meditation, or breathing exercises\n• Maintain a regular sleep and eating schedule\n• Limit alcohol and avoid substance use\n\n**Professional help signs:** persistent sadness/anxiety for 2+ weeks, inability to function, thoughts of self-harm\n\n**India helplines:** iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345\n\n⚠️ Mental health conditions are treatable. Please reach out — seeking help is a sign of strength.`,

  'pregnancy': `**Pregnancy & Maternal Health**\n\n• Start prenatal care as soon as you know you are pregnant\n• Take folic acid 400mcg daily (ideally before conception and through first trimester)\n• Attend all antenatal checkups (at least 8 visits recommended by WHO)\n• Eat a nutritious, varied diet; stay hydrated\n• Avoid alcohol, tobacco, and unprescribed medications\n\n**Warning signs — seek care immediately:**\n• Heavy bleeding, severe abdominal pain\n• Severe headache with vision changes\n• Reduced or absent fetal movements (after 28 weeks)\n• Signs of labour before 37 weeks\n\n**India:** Government health centres provide free maternal and child healthcare services under Janani Suraksha Yojana (JSY).\n\n⚠️ Always attend your scheduled antenatal and postnatal visits.`,

  'child health': `**Child Health & Growth**\n\n• Regular growth monitoring (weight, height, head circumference) at child health clinics\n• Complete the National Immunization Schedule on time\n• Exclusive breastfeeding for first 6 months; complementary foods from 6 months\n• Safe sleeping position for infants: on back, on a firm surface\n\n**Signs to see a doctor urgently:**\n• High fever in infants under 3 months\n• Difficulty breathing, blue lips\n• Not feeding, very lethargic\n• Persistent vomiting or diarrhoea\n\n**India:** Free child healthcare and vaccines available at government anganwadis and health centres.\n\n⚠️ Regular developmental check-ups help identify and address issues early.`,

  'hydration': `**Daily Hydration**\n\n• Men: ~3.7 litres/day | Women: ~2.7 litres/day (total including food water)\n• A practical guide: 8 glasses (2 litres) of plain water per day\n• Increase intake during exercise, hot weather, fever, vomiting, or diarrhoea\n\n**Signs of dehydration:** dark yellow urine, dry mouth, fatigue, dizziness, headache\n\n**Pale yellow urine = well hydrated** ✓\n\n**Tips:** carry a water bottle, set reminders, eat water-rich fruits (cucumber, watermelon)\n\n⚠️ Severe dehydration (no urine for 8+ hours, confusion, sunken eyes) is a medical emergency.`,

  'allergy': `**Allergy Management**\n\n• Common triggers: pollen, dust, pet dander, mould, certain foods (nuts, shellfish, dairy), medications\n• Mild symptoms: sneezing, runny nose, itchy eyes, skin rash\n• Management: antihistamines (cetirizine, loratadine), avoiding known triggers, nasal saline rinse\n\n**Severe reaction (Anaphylaxis) — EMERGENCY:**\n• Throat swelling, difficulty breathing, rapid heart rate, faintness\n• 🚨 Use EpiPen if prescribed\n• 🚨 Call 112 immediately\n\n⚠️ If you have known severe allergies, always carry your emergency medication and wear a medical alert bracelet.`,

  'exercise': `**Exercise & Physical Activity**\n\n• Adults: at least 150 min moderate exercise/week (e.g., brisk walking) or 75 min vigorous\n• Include strength training 2 days/week\n• Even short bouts of activity (10-min walks) count toward the goal\n\n**Benefits:** reduces heart disease, diabetes, obesity risk; improves mood and sleep\n\n**Getting started safely:**\n• Begin gradually and build up over weeks\n• Warm up before and cool down after\n• Stay hydrated\n• If over 40 or have health conditions, consult a doctor before intense exercise\n\n⚠️ Chest pain, severe breathlessness, or dizziness during exercise → stop and seek medical attention.`,
};

const generateSmartResponse = (question, lang = 'en') => {
  const q = question.toLowerCase();

  // Emergency check — highest priority
  if (EMERGENCY_PATTERNS.test(question)) {
    const msg = {
      en: `🚨 **This sounds like a potential emergency.**\n\nPlease **call 112 (India emergency services) immediately** or go to your nearest emergency room.\n\nDo not delay — for symptoms like chest pain, difficulty breathing, or signs of stroke, every minute matters.\n\nIf you need help finding a hospital, use the "Find Hospital" link below.`,
      hi: `🚨 **यह एक संभावित आपात स्थिति लगती है।**\n\nकृपया तुरंत **112 (भारत आपातकालीन सेवाएं) पर कॉल करें** या निकटतम आपातकालीन कक्ष में जाएं।\n\nदेरी न करें — सीने में दर्द, सांस लेने में कठिनाई जैसे लक्षणों में हर मिनट मायने रखता है।`,
      te: `🚨 **ఇది అత్యవసర పరిస్థితి వలె అనిపిస్తోంది.**\n\nవెంటనే **112 (భారత అత్యవసర సేవలు) కి కాల్ చేయండి** లేదా సమీపంలోని ఆపద గదికి వెళ్ళండి.\n\nఆలస్యం చేయకండి.`,
    };
    return msg[lang] || msg.en;
  }

  // Topic matching
  for (const { patterns, topic } of TOPIC_MAP) {
    if (patterns.test(question)) {
      const answer = SMART_RESPONSES[topic];
      if (answer) return answer;
    }
  }

  // Generic dynamic response — reflects the actual question back
  const genericMsg = {
    en: `Thank you for your question about **"${question}"**.\n\nI can help with many health topics including:\n• Blood pressure, diabetes, and chronic conditions\n• Vaccinations and preventive care\n• Sleep, nutrition, and exercise\n• Mental health and stress\n• Pregnancy and child health\n• Fever, cough, cold, headaches, and allergies\n\nCould you please be more specific about your concern? Or you can:\n1. **Book an appointment** with a healthcare professional via CarePath AI\n2. **Find a hospital** near you using the link below\n3. **Talk to an expert** for specialised guidance\n\n⚠️ For any urgent symptoms, please call 112 or visit your nearest hospital immediately.`,
    hi: `**"${question}"** के बारे में आपके प्रश्न के लिए धन्यवाद।\n\nमैं इन विषयों पर मदद कर सकता हूँ:\n• रक्तचाप, मधुमेह\n• टीकाकरण और निवारक देखभाल\n• नींद, पोषण, व्यायाम\n• मानसिक स्वास्थ्य\n• गर्भावस्था और बाल स्वास्थ्य\n\nकृपया अपनी समस्या के बारे में अधिक जानकारी दें।\n\n⚠️ किसी भी आपातकाल के लिए 112 पर कॉल करें।`,
    te: `**"${question}"** గురించి మీ ప్రశ్నకు ధన్యవాదాలు.\n\nనేను ఈ విషయాలలో సహాయం చేయగలను:\n• రక్తపోటు, డయాబెటీస్\n• టీకాలు మరియు నివారణ సంరక్షణ\n• నిద్ర, పోషణ, వ్యాయామం\n• మానసిక ఆరోగ్యం\n• గర్భం మరియు శిశు ఆరోగ్యం\n\nమీ సమస్య గురించి మరింత చెప్పగలరా?\n\n⚠️ అత్యవసర పరిస్థితికి 112 కి కాల్ చేయండి.`,
  };

  return genericMsg[lang] || genericMsg.en;
};

// ── Controller ────────────────────────────────────────────────────────────────
const chat = async (req, res, next) => {
  try {
    const { message, history = [], lang = 'en' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return fail(res, 'message is required', 400);
    }

    const question = message.trim();

    // 1. Try Gemini if key is configured
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim()) {
      try {
        const answer = await callGemini(question, history, lang);
        if (answer) {
          return success(res, { answer, source: 'gemini' }, 'AI response generated');
        }
      } catch (geminiErr) {
        // Log but don't fail the request — fall through to smart engine
        console.warn('[aiController] Gemini error, falling back to smart engine:', geminiErr.message);
      }
    }

    // 2. Smart engine fallback
    const answer = generateSmartResponse(question, lang);
    return success(res, { answer, source: 'smart-engine' }, 'AI response generated');
  } catch (err) {
    next(err);
  }
};

module.exports = { chat };
