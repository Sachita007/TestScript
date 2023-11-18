const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');

// Hardcoded absolute paths
const VERSION_URL = 'https://sachita007.github.io/TestScript/version.json';
const SCRIPT_URL = 'https://sachita007.github.io/TestScript/script.js.enc';
const DECRYPTION_KEY = 'your_decryption_key';  // Replace with your actual decryption key

const INSTALL_DIR = '/opt/myscripts';

// Flag to prevent concurrent version check and update
let updatingVersion = false;

function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(`Failed to download file. Status code: ${response.statusCode}`);
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
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
        if (updatingVersion) {
            console.log('Already updating version. Skipping.');
            return;
        }

        console.log('Checking for a new version...');
        updatingVersion = true;

        // Read the current version before the update
        const currentVersion = await readVersion();
        console.log('Current version before update:', currentVersion);

        try {
            // Attempt to download the new version information
            const response = await new Promise((resolve, reject) => {
                https.get(VERSION_URL, (res) => {
                    if (res.statusCode !== 200) {
                        reject(`Failed to fetch version information. Status code: ${res.statusCode}`);
                        return;
                    }

                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        resolve(JSON.parse(data));
                    });
                }).on('error', (err) => {
                    reject(err.message);
                });
            });

            console.log('Response from version check:', response);

            const newVersion = response.version;

            if (currentVersion !== newVersion) {
                console.log(`Version has changed from ${currentVersion} to ${newVersion}. Updating version information...`);

                // Create a new directory for the updated version
                const newVersionDir = `${INSTALL_DIR}/${newVersion}`;
                if (!fs.existsSync(newVersionDir)) {
                    fs.mkdirSync(newVersionDir);
                }

                // Download the new version information
                await downloadFile(VERSION_URL, `${newVersionDir}/version.json`);
                console.log('Version information updated successfully.');

                // Download the script without checking for its existence
                console.log('Downloading the script...');
                await downloadFile(SCRIPT_URL, `${newVersionDir}/script.js.enc`);
                console.log('Script downloaded successfully.');

                // Decrypt the script
                await decryptScript(`${newVersionDir}/script.js.enc`, `${newVersionDir}/script.js`);
                console.log('Script decrypted successfully.');

                // Update the paths in the systemd service
                const updaterServicePath = '/etc/systemd/system/updater.service';
                const updatedServiceContent = fs.readFileSync(updaterServicePath, 'utf8').replace(/\/opt\/myscripts/g, newVersionDir);
                fs.writeFileSync(updaterServicePath, updatedServiceContent, 'utf8');
            } else {
                console.log('You already have the latest version of the script.');

                // Check if the decrypted script is available
                const decryptedScriptFileName = `${INSTALL_DIR}/script.js`;
                if (!fs.existsSync(decryptedScriptFileName)) {
                    console.log('Decrypted script not available. Decrypting...');
                    await decryptScript(`${INSTALL_DIR}/script.js.enc`, decryptedScriptFileName);
                    console.log('Script decrypted successfully.');
                }
            }
        } catch (error) {
            console.error('Error checking for new version:', error);

            // If there is an error, attempt to download the version file
            console.log('Attempting to download version information...');
            await downloadFile(VERSION_URL, `${INSTALL_DIR}/version.json`);
            console.log('Version information updated successfully.');

            // Download the script without checking for its existence
            console.log('Downloading the script...');
            await downloadFile(SCRIPT_URL, `${INSTALL_DIR}/script.js.enc`);
            console.log('Script downloaded successfully.');

            // Decrypt the script
            await decryptScript(`${INSTALL_DIR}/script.js.enc`, `${INSTALL_DIR}/script.js`);
            console.log('Script decrypted successfully.');
        }
    } finally {
        updatingVersion = false;
    }
}

// Function to read the version from version.json
function readVersion() {
    return new Promise((resolve, reject) => {
        fs.readFile(`${INSTALL_DIR}/version.json`, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.log('Version file not found. Using default version 0.0.0.');
                    resolve('0.0.0');
                } else {
                    console.error('Error reading version:', err);
                    reject(err);
                }
            } else {
                try {
                    const versionObject = JSON.parse(data);
                    resolve(versionObject.version);
                } catch (parseError) {
                    console.error('Error parsing version JSON:', parseError);
                    reject(parseError);
                }
            }
        });
    });
}

// Function to decrypt the script
async function decryptScript(scriptFileName, decryptedScriptFileName) {
    return new Promise((resolve, reject) => {
        exec(`/usr/bin/openssl enc -aes-256-cbc -d -in ${scriptFileName} -out ${decryptedScriptFileName} -k ${DECRYPTION_KEY}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Error decrypting the script:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Function to run the Node.js script
function runScript() {
    exec(`node ${INSTALL_DIR}/script.js`, (err, stdout, stderr) => {
        if (err) {
            console.error('Error executing the script:', err);
        } else {
            // Log the output of the script
            console.log('Output of the script:');
            console.log('----------------------------------------');
            console.log(stdout);
            console.log('----------------------------------------');
        }
    });
}

// Function to handle version update and trigger a new version check
async function updateAndCheckForNewVersion() {
    await checkForNewVersion();
    runScript();
}

// Run the script initially
updateAndCheckForNewVersion();

// Schedule the script to check for a new version every 10 minutes
setInterval(updateAndCheckForNewVersion, 10000); // 10 minutes






































// const https = require('https');
// const fs = require('fs');
// const { exec } = require('child_process');

// // Hardcoded absolute paths
// const SCRIPT_URL = 'https://sachita007.github.io/TestScript/script.js.enc';
// const VERSION_URL = 'https://sachita007.github.io/TestScript/version.json';
// const DECRYPTION_KEY = 'your_decryption_key';  // Replace with your actual decryption key
// const SCRIPT_FILE = '/opt/myscripts/script.js.enc';
// const VERSION_FILE = '/opt/myscripts/version.json';

// // Flag to prevent concurrent version check and update
// let updatingVersion = false;

// function downloadFile(url, destination) {
//     return new Promise((resolve, reject) => {
//         const file = fs.createWriteStream(destination);
//         https.get(url, (response) => {
//             if (response.statusCode !== 200) {
//                 reject(`Failed to download file. Status code: ${response.statusCode}`);
//                 return;
//             }

//             response.pipe(file);
//             file.on('finish', () => {
//                 file.close();
//                 resolve();
//             });
//         }).on('error', (err) => {
//             fs.unlink(destination, () => { }); // Delete the file if there is an error
//             reject(err.message);
//         });
//     });
// }

// // Function to check for a new version
// async function checkForNewVersion() {
//     try {
//         if (updatingVersion) {
//             console.log('Already updating version. Skipping.');
//             return;
//         }

//         console.log('Checking for a new version...');
//         updatingVersion = true;

//         // Read the current version before the update
//         const currentVersion = await readVersion();
//         console.log('Current version before update:', currentVersion);

//         try {
//             // Attempt to download the new version information
//             const response = await new Promise((resolve, reject) => {
//                 https.get(VERSION_URL, (res) => {
//                     if (res.statusCode !== 200) {
//                         reject(`Failed to fetch version information. Status code: ${res.statusCode}`);
//                         return;
//                     }

//                     let data = '';
//                     res.on('data', (chunk) => {
//                         data += chunk;
//                     });
//                     res.on('end', () => {
//                         resolve(JSON.parse(data));
//                     });
//                 }).on('error', (err) => {
//                     reject(err.message);
//                 });
//             });

//             console.log('Response from version check:', response);

//             const newVersion = response.version;

//             if (currentVersion !== newVersion) {
//                 console.log(`Version has changed from ${currentVersion} to ${newVersion}. Updating version information...`);

//                 // Download the new version information
//                 await downloadFile(VERSION_URL, VERSION_FILE);
//                 console.log('Version information updated successfully.');

//                 // Download the script without checking for its existence
//                 console.log('Downloading the script...');
//                 await downloadFile(SCRIPT_URL, SCRIPT_FILE);
//                 console.log('Script downloaded successfully.');

//                 // Decrypt the script
//                 await decryptScript(SCRIPT_FILE, '/opt/myscripts/script.js');
//                 console.log('Script decrypted successfully.');
//             } else {
//                 console.log('You already have the latest version of the script.');

//                 // Check if the decrypted script is available
//                 const decryptedScriptFileName = '/opt/myscripts/script.js';
//                 if (!fs.existsSync(decryptedScriptFileName)) {
//                     console.log('Decrypted script not available. Decrypting...');
//                     await decryptScript(SCRIPT_FILE, decryptedScriptFileName);
//                     console.log('Script decrypted successfully.');
//                 }
//             }
//         } catch (error) {
//             console.error('Error checking for new version:', error);

//             // If there is an error, attempt to download the version file
//             console.log('Attempting to download version information...');
//             await downloadFile(VERSION_URL, VERSION_FILE);
//             console.log('Version information updated successfully.');

//             // Download the script without checking for its existence
//             console.log('Downloading the script...');
//             await downloadFile(SCRIPT_URL, SCRIPT_FILE);
//             console.log('Script downloaded successfully.');

//             // Decrypt the script
//             await decryptScript(SCRIPT_FILE, '/opt/myscripts/script.js');
//             console.log('Script decrypted successfully.');
//         }
//     } finally {
//         updatingVersion = false;
//     }
// }

// // Function to read the version from version.json
// function readVersion() {
//     return new Promise((resolve, reject) => {
//         fs.readFile(VERSION_FILE, 'utf8', (err, data) => {
//             if (err) {
//                 if (err.code === 'ENOENT') {
//                     console.log('Version file not found. Using default version 0.0.0.');
//                     resolve('0.0.0');
//                 } else {
//                     console.error('Error reading version:', err);
//                     reject(err);
//                 }
//             } else {
//                 try {
//                     const versionObject = JSON.parse(data);
//                     resolve(versionObject.version);
//                 } catch (parseError) {
//                     console.error('Error parsing version JSON:', parseError);
//                     reject(parseError);
//                 }
//             }
//         });
//     });
// }

// // Function to decrypt the script
// async function decryptScript(scriptFileName, decryptedScriptFileName) {
//     return new Promise((resolve, reject) => {
//         exec(`/usr/bin/openssl enc -aes-256-cbc -d -in ${scriptFileName} -out ${decryptedScriptFileName} -k ${DECRYPTION_KEY}`, (err, stdout, stderr) => {
//             if (err) {
//                 console.error('Error decrypting the script:', err);
//                 reject(err);
//             } else {
//                 resolve();
//             }
//         });
//     });
// }

// // Function to run the Node.js script
// function runScript() {
//     exec('node /opt/myscripts/script.js', (err, stdout, stderr) => {
//         if (err) {
//             console.error('Error executing the script:', err);
//         } else {
//             // Log the output of the script
//             console.log('Output of the script:');
//             console.log('----------------------------------------');
//             console.log(stdout);
//             console.log('----------------------------------------');
//         }
//     });
// }

// // Function to handle version update and trigger a new version check
// async function updateAndCheckForNewVersion() {
//     await checkForNewVersion();
//     runScript();
// }

// // Run the script initially
// updateAndCheckForNewVersion();

// // Schedule the script to check for a new version every 10 minutes
// setInterval(updateAndCheckForNewVersion, 10000); // 10 minutes
