import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { FIREBASE_SERVICE_ACCOUNT_PATH } = process.env;

// Log environment variables for debugging
console.log('FIREBASE_SERVICE_ACCOUNT_PATH:', FIREBASE_SERVICE_ACCOUNT_PATH);

if (!FIREBASE_SERVICE_ACCOUNT_PATH) {
    throw new Error('Missing required environment variables');
}

// Asynchronous function to handle Firebase initialization
async function initializeApp() {
    try {
        // Read JSON file with service account
        const serviceAccountPath = path.resolve(FIREBASE_SERVICE_ACCOUNT_PATH);
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        // Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        // Connect to Firestore
        const db = admin.firestore();
        console.log('Firebase initialized');

        // Firebase functions for user registration, login, profile updates, etc.
        // Register User (Customer or Contractor)
        exports.registerUser = async (req, res) => {
            const { name, email, password, isCompany } = req.body;
            try {
                // Create user in Firebase Auth
                const userRecord = await admin.auth().createUser({
                    email,
                    password,
                });

                // Add user details to Firestore
                await db.collection('users').doc(userRecord.uid).set({
                    name,
                    email,
                    isCompany: isCompany || false, // true if contractor, false if customer
                });

                res.status(201).json({ message: 'User registered successfully' });
            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        };

        // Login Route
        exports.loginUser = async (req, res) => {
            const { email, password } = req.body;
            try {
                // Verify the credentials
                const user = await admin.auth().getUserByEmail(email);
                
                // Fetch user details from Firestore
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const userData = userDoc.data();

                // Generate a custom Firebase token for the logged-in user
                const token = await admin.auth().createCustomToken(user.uid);
                
                res.json({
                    token,
                    isCompany: userData.isCompany, // Send user role to frontend
                });
            } catch (err) {
                res.status(400).json({ error: 'Invalid credentials' });
            }
        };

        // Update Profile Route
        exports.updateProfile = async (req, res) => {
            const { uid, name, email, isCompany } = req.body;

            try {
                // Update user in Firebase Authentication (optional, only if name or email is being changed)
                if (name || email) {
                    await admin.auth().updateUser(uid, {
                        displayName: name,
                        email: email,
                    });
                }

                // Update Firestore document
                await db.collection('users').doc(uid).update({
                    name,
                    email,
                    isCompany,
                });

                res.status(200).json({ message: 'Profile updated successfully' });
            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        };

        // Get User Profile Route
        exports.getProfile = async (req, res) => {
            const { uid } = req.params;

            try {
                const userDoc = await db.collection('users').doc(uid).get();
                if (!userDoc.exists) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const userData = userDoc.data();
                res.status(200).json(userData);
            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        };

    } catch (error) {
        console.error('Error initializing Firebase app:', error);
    }
}

// Run initializeApp when the file loads
initializeApp();