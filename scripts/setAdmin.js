/* eslint-env node */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../service-account.json');

// --- Initialize Firebase Admin ---
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Error: Service account file not found at ${SERVICE_ACCOUNT_PATH}`);
    console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const setAdmin = async (email) => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { municipal_admin: true });
        console.log(`Success! ${email} is now a municipal_admin.`);
        console.log('Ask the user to log out and log back in to see changes.');
    } catch (error) {
        console.error('Error setting admin claim:', error);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node scripts/setAdmin.js <email>');
    process.exit(1);
}

setAdmin(email);