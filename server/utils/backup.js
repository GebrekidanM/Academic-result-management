const { MongoClient } = require('mongodb');
const { Octokit } = require('octokit');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const performBackup = async () => {
    const client = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        let backupData = {};

        for (let col of collections) {
            if (col.name.startsWith('system.')) continue;
            backupData[col.name] = await db.collection(col.name).find({}).toArray();
        }

        const jsonString = JSON.stringify(backupData); // Minify to save space
        const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;

        // GitHub Upload
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: `backups/${fileName}`, // Put backups in a folder
            message: `Backup: ${new Date().toISOString()}`,
            content: Buffer.from(jsonString).toString('base64')
        });

        // Telegram Notification
        const form = new FormData();
        form.append('document', Buffer.from(jsonString), { filename: fileName });
        form.append('chat_id', process.env.TG_CHAT_ID);
        form.append('caption', `✅ Backup successful: ${fileName}`);
        
        await axios.post(`https://api.telegram.org/bot${process.env.TG_TOKEN}/sendDocument`, form, {
            headers: form.getHeaders()
        });

        console.log(`✅ Backup ${fileName} completed successfully.`);
    } catch (err) {
        console.error("❌ Backup failed:", err.message);
    } finally {
        await client.close();
    }
};


module.exports = { performBackup };