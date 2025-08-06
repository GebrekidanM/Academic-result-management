require('dotenv').config();

const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

// A crucial check to ensure the server doesn't start without the keys
if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error("FATAL ERROR: VAPID keys are not defined in your .env file. Push notifications will not work.");
    // In a real production environment, you might want to exit the process:
    // process.exit(1);
} else {
    webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );
    console.log("Web Push notifications configured successfully.");
}
