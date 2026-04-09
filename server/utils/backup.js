const { MongoClient } = require('mongodb');
const { Octokit } = require('octokit');
const axios = require('axios');
const FormData = require('form-data');
const cron = require('node-cron');

const performBackup = async () => {
    console.log("🕒 Starting Automated Backup...");
    const client = new MongoClient(process.env.MONGO_URI); // Ensure this is in your .env
    
    try {
        await client.connect();
        const db = client.db(); // Connects to the DB defined in your URI
        const collections = await db.listCollections().toArray();
        let backupData = {};

        for (let col of collections) {
            backupData[col.name] = await db.collection(col.name).find({}).toArray();
        }

        const jsonString = JSON.stringify(backupData, null, 2);
        const fileName = `db_backup_${new Date().toISOString().replace(/:/g, '-')}.json`;

        // 1. Upload to GitHub
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: fileName,
            message: `Backup: ${new Date().toLocaleDateString()}`,
            content: Buffer.from(jsonString).toString('base64')
        });

        // 2. Alert Telegram
        const form = new FormData();
        form.append('document', Buffer.from(jsonString), fileName);
        form.append('chat_id', process.env.TG_CHAT_ID);
        await axios.post(`https://api.telegram.org/bot${process.env.TG_TOKEN}/sendDocument`, form, {
            headers: form.getHeaders()
        });

        console.log("✅ Backup saved to GitHub and sent to Telegram!");
    } catch (err) {
        console.error("❌ Backup failed:", err);
    } finally {
        await client.close();
    }
};
performBack(up);

// Schedule: 1st, 6th, 12th, 18th, 24th at 03:00
cron.schedule('0 3 1,6,12,18,24 * *', performBackup);