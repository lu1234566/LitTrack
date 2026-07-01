const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

// The Gemini API key lives here as a Firebase secret — NEVER in the app bundle
// or in git. Set it once with:  firebase functions:secrets:set GEMINI_KEY
const GEMINI_KEY = defineSecret('GEMINI_KEY');

// The model is chosen server-side so the client can't ask for an expensive one.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Proxy: app -> this function -> Gemini. The app sends the Gemini request body
// (contents / systemInstruction / generationConfig); we add the key and forward.
// A valid Firebase Auth ID token is required so strangers can't burn your quota.
exports.aiProxy = onRequest({ secrets: [GEMINI_KEY], cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Faça login para usar a IA.' });
    return;
  }
  try {
    await admin.auth().verifyIdToken(token);
  } catch (e) {
    res.status(401).json({ error: 'Sessão inválida.' });
    return;
  }

  try {
    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + GEMINI_KEY.value(),
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req.body || {}) }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    console.error('aiProxy upstream error', e);
    res.status(500).json({ error: 'Falha ao contatar a IA. Tente novamente.' });
  }
});
