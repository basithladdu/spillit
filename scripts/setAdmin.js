import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for service account file
const serviceAccountPath = path.join(__dirname, '../service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: service-account.json not found in the root directory.');
    console.log('To run this script, you need to:');
    console.log('1. Go to Firebase Console -> Project Settings -> Service accounts.');
    console.log('2. Click "Generate new private key".');
    console.log('3. Rename the downloaded file to "service-account.json" and place it in the root of this project.');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2];

if (!email) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Please provide an email address.');
    console.log('Usage: node scripts/setAdmin.js <email>');
    process.exit(1);
}

async function setAdmin() {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, {
            municipal_admin: true
        });
        console.log('\x1b[32m%s\x1b[0m', `Success! User ${email} has been granted municipal_admin privileges.`);
        console.log('They can now log in at /login and access the Municipal Dashboard.');
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error('\x1b[31m%s\x1b[0m', `Error: User with email ${email} does not exist.`);
            console.log('Please create an account for this email first (e.g., via the Register page).');
        } else {
            console.error('Error setting admin claim:', error);
        }
    } finally {
        process.exit();
    }
}

setAdmin();