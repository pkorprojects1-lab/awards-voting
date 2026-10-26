// server.js — Outstanding Headteacher & Principal Awards 2026: paid public voting.
// Standalone project. It has its own repo, Render service, Firebase project and
// Lipwa account, so it does not touch any other app.

const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const registerVoting = require('./voting');

const REQUIRED = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'ADMIN_KEY'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
    console.error('Missing environment variables:', missing.join(', '));
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
});
const db = admin.firestore();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check so you can confirm the service is live
app.get('/health', (req, res) => res.json({ ok: true }));

const voting = registerVoting(app, { db, admin });

// Lipwa payment webhook for this project. Set this URL in this project's Lipwa account:
// https://<this-service>.onrender.com/api/callback
app.post('/api/callback', async (req, res) => {
    try {
        console.log('Lipwa callback:', JSON.stringify(req.body));
        await voting.handleCallback(req.body);
    } catch (err) {
        console.error('Callback error:', err);
    }
    res.json({ received: true });
});

app.get('/', (req, res) => res.redirect('/vote.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Awards voting running on port ${PORT}`));
