import express from 'express';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Konvertera ES-modul till __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ladda miljövariabler
dotenv.config();

const { FIREBASE_SERVICE_ACCOUNT_PATH } = process.env;

// Kontrollera att servicekontonyckeln finns
if (!FIREBASE_SERVICE_ACCOUNT_PATH) {
    throw new Error('Missing required environment variables');
}

// Läsa in servicekontonyckeln för Firebase
const serviceAccount = JSON.parse(readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));

// Initialisera Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Anslut till Firestore
const db = admin.firestore();

// Skapa Express-app
const app = express();
app.use(express.json()); // För att hantera JSON-request bodies

// Serva statiska filer från public/
app.use(express.static(path.join(__dirname, 'public')));

// Serva startsidan (Startsida.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Startsida.html'));
});

// **API:er för Firebase Autentisering och Firestore**

// **Registrera användare (Kund eller Hantverkare)**
app.post('/register', async (req, res) => {
    const { name, email, password, isCompany } = req.body;
    try {
        // Skapa användare i Firebase Authentication
        const userRecord = await admin.auth().createUser({ email, password });

        // Lagra användarinformation i Firestore
        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            isCompany: isCompany || false, // true för hantverkare, false för kund
        });

        res.status(201).json({ message: 'Användare registrerad' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// **Logga in användare**
app.post('/login', async (req, res) => {
    const { email } = req.body;
    try {
        // Hämta användare från Firebase Auth
        const user = await admin.auth().getUserByEmail(email);

        // Hämta användardata från Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Användare ej hittad' });
        }
        const userData = userDoc.data();

        // Skapa en anpassad token för användaren
        const token = await admin.auth().createCustomToken(user.uid);

        res.json({
            token,
            isCompany: userData.isCompany, // Skicka användarroll till frontend
        });
    } catch (err) {
        res.status(400).json({ error: 'Felaktiga uppgifter' });
    }
});

// **Uppdatera användarprofil**
app.post('/update-profile', async (req, res) => {
    const { uid, name, email, isCompany } = req.body;

    try {
        // Uppdatera Firebase Authentication
        if (name || email) {
            await admin.auth().updateUser(uid, {
                displayName: name,
                email: email,
            });
        }

        // Uppdatera Firestore-dokument
        await db.collection('users').doc(uid).update({
            name,
            email,
            isCompany,
        });

        res.status(200).json({ message: 'Profil uppdaterad' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// **Hämta användarprofil**
app.get('/profile/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Användare ej hittad' });
        }
        const userData = userDoc.data();
        res.status(200).json(userData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Starta servern
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server körs på http://localhost:${PORT}`));
