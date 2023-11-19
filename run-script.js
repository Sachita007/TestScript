const fs = require('fs');
const { exec } = require('child_process');

const INSTALL_DIR = '/opt/myscripts';
const VERSION_INFO_PATH = '/opt/myscripts/versionInfo.json';

async function readVersionInfo() {
    return new Promise((resolve, reject) => {
        fs.readFile(VERSION_INFO_PATH, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const versionInfo = JSON.parse(data);
                    resolve(versionInfo);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

async function runScript(version) {
    return new Promise((resolve, reject) => {
        const scriptPath = `${INSTALL_DIR}/${version}/script.js`;
        exec(`node "${scriptPath}"`, (err, stdout, stderr) => {
            if (err) {
                console.error('Error executing the script:', err);
                reject(err);
            } else {
                // Log the output of the script
                console.log('Output of the script:');
                console.log('----------------------------------------');
                console.log(stdout);
                console.log('----------------------------------------');
                resolve();
            }
        });
    });
}



function updateService(newVersion) {
    console.log('Updating the service...');

    // Read the updater.service file
    const serviceFilePath = '/etc/systemd/system/updater.service'; // Modify the path as needed
    const serviceFileContent = fs.readFileSync(serviceFilePath, 'utf8');

    // Update the version in the ExecStart command
    const updatedExecStart = serviceFileContent.replace(/ExecStart=.+/, `ExecStart=/usr/bin/node /opt/myscripts/${newVersion}/updater.js https://sachita007.github.io/TestScript 661588cc19bc2c9d6dc04900f2dd49596c00ce544d0f52eb7ac0e17ab1ffaf4c ${newVersion}`);

    // Write the updated content back to the updater.service file
    fs.writeFileSync(serviceFilePath, updatedExecStart, 'utf8');

    console.log('Service updated successfully.');
}





async function checkAndRunScript() {
    try {
        const versionInfo = await readVersionInfo();
        console.log('Current version:', versionInfo.currentVersion);
        console.log('New version:', versionInfo.newVersion);

        // Check if the current version is different from the previous version
        if (versionInfo.currentVersion !== versionInfo.newVersion) {
            console.log('Versions have changed. Running script...');

            try {
                await runScript(versionInfo.currentVersion);
                console.log('Script ran successfully.');

                // TODO: Add logic to update the service or perform other actions after running the script.
                await updateService(versionInfo.newVersion);

                // Update the previous version to match the current version
                versionInfo.currentVersion = versionInfo.newVersion;
                fs.writeFileSync(VERSION_INFO_PATH, JSON.stringify(versionInfo, null, 2));
                console.log('VersionInfo updated successfully.');
            } catch (runScriptError) {
                console.error('Error running the script:', runScriptError);
            }
        } else {
            console.log('Versions have not changed. No action needed.');
        }
    } catch (error) {
        console.error('Error checking and running script:', error);
    }
}

// Run the script initially
checkAndRunScript();

// Schedule the script to check for changes and run every 10 minutes
setInterval(checkAndRunScript, 600000); // 10 minutes
