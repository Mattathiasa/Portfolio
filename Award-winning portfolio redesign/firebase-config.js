// Paste your Firebase web-app config here (same values as VITE_FIREBASE_* in the repo's .env).
// Leave apiKey empty to run on the bundled defaults (no network).
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};
// SHA-256 hex of the admin password (VITE_ADMIN_HASH). Empty = demo mode, any password works.
export const adminHash = '';
// EmailJS (VITE_EMAILJS_*). Empty = contact form falls back to opening the visitor's mail app.
export const emailjs = { serviceId: '', templateId: '', publicKey: '' };
// Chat: Groq key for local dev (VITE_GROK_API_KEY). Empty = POST /api/chat (the Vercel function in the repo).
export const groqApiKey = '';
