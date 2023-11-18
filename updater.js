const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');

// Parse command-line arguments
const args = process.argv.slice(2);

// Ensure that the required arguments are provided
if (args.length < 3) {
    console.error('Usage: node updater.js <scriptUrl> <versionUrl> <decryptionKey>');
    process.exit(1);
}

const SCRIPT_URL = args[0];
const VERSION_URL = args[1];
const DECRYPTION_KEY = args[2];

// Function to download a file
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => { }); // Delete the file if there is an error
            reject(err.message);
        });
    });
}

// Function to check for a new version
async function checkForNewVersion() {
    try {
        const currentVersion = require('./version.json').version;
        const response = await new Promise((resolve) => {
            https.get(VERSION_URL, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });
        });

        const newVersion = response.version;

        if (currentVersion !== newVersion) {
            console.log(`Version has changed from ${currentVersion} to ${newVersion}. Updating script...`);
            await downloadFile(SCRIPT_URL, 'script.js.enc');
            console.log('Script updated successfully.');
        } else {
            console.log('You already have the latest version of the script.');
        }
    } catch (error) {
        console.error('Error checking for new version:', error);
    }
}

// Function to run the Node.js script
function runScript() {
    exec(`openssl enc -aes-256-cbc -d -in script.js.enc -out script.js -k ${DECRYPTION_KEY}`, (err, stdout, stderr) => {
        if (err) {
            console.error('Error decrypting the script:', err);
        } else {
            console.log('Executing the script...');
            exec('node script.js', (err, stdout, stderr) => {
                if (err) {
                    console.error('Error executing the script:', err);
                }
            });
        }
    });
}

// Run the script initially
runScript();

// Schedule the script to check for a new version every 10 minutes
setInterval(() => {
    console.log('Checking for a new version...');
    checkForNewVersion().then(() => runScript());
}, 10 * 60 * 1000); // 10 minutes
