const { MongoClient } = require('mongodb');
const { Octokit } = require('octokit');
const axios = require('axios');
const FormData = require('form-data');
const cron = require('node-cron');

// --- CONFIGURATION (NO CARDS REQUIRED) ---
const MONGO_URI = "YOUR_MONGO_URI";
const DB_NAME = "YOUR_DB_NAME";



async function performBackup() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collections = await db.listCollections().toArray();
        let backupData = {};

        for (let col of collections) {
            backupData[col.name] = await db.collection(col.name).find({}).toArray();
        }

        const jsonString = JSON.stringify(backupData, null, 2);
        const fileName = `backup_${new Date().toISOString().replace(/:/g, '-')}.json`;

        // 1. UPLOAD TO GITHUB (Forever Storage)
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER, repo: GITHUB_REPO, path: fileName,
            message: `Backup: ${new Date().toLocaleDateString()}`,
            content: Buffer.from(jsonString).toString('base64')
        });
        console.log("GitHub Storage Successful!");

        // 2. UPLOAD TO TELEGRAM (Backup Alert)
        const form = new FormData();
        form.append('document', Buffer.from(jsonString), fileName);
        form.append('chat_id', TG_CHAT_ID);
        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendDocument`, form, {
            headers: form.getHeaders()
        });
        console.log("Telegram Backup Alert Successful!");

    } catch (err) {
        console.error("Backup Error:", err);
    } finally {
        await client.close();
    }
}

// Schedule: 1st, 6th, 12th, 18th, 24th
cron.schedule('0 3 1,6,12,18,24 * *', performBackup);