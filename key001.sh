#!/bin/bash

# URL locations for the files on GitLab or GitHub Pages
SCRIPT_URL="https://sachita007.github.io/TestScript/script.js.enc"
VERSION_URL="https://sachita007.github.io/TestScript/version.json"

# Derive the variable name from the script name
VAR_NAME=$(basename "$0" .sh)
echo "${VAR_NAME}"

# Fetch the key from the derived environment variable
DECRYPTION_KEY="${!VAR_NAME}"

# Check if the key variable is set
if [ -z "$DECRYPTION_KEY" ]; then
    echo "Error: The decryption key is not set."
    exit 1
fi

# Function to download the encrypted script
download_script() {
    echo "Downloading the encrypted script..."
    wget -O script.js.enc $SCRIPT_URL
}

# Function to download the version file
download_version() {
    echo "Downloading the version file..."
    wget -O version.json $VERSION_URL
}

# Check if version.json exists
if [ ! -f version.json ]; then
    echo "Version file not found!"
    download_version
    download_script
else
    # Check for a version change
    CURRENT_VERSION=$(cat version.json | grep version | awk -F '"' '{print $4}')
    download_version
    NEW_VERSION=$(cat version.json | grep version | awk -F '"' '{print $4}')

    if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
        echo "Version has changed from $CURRENT_VERSION to $NEW_VERSION. Updating script..."
        download_script
    else
        echo "You already have the latest version of the script."
    fi
fi

# Check if script.js.enc exists, if not, download
if [ ! -f script.js.enc ]; then
    echo "Encrypted script not found!"
    download_script
fi

# Decrypt the file
openssl enc -aes-256-cbc -d -in script.js.enc -out script.js -k $DECRYPTION_KEY

# Execute the Node.js script
node script.js
