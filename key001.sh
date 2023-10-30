#!/bin/bash

# Formatting variables
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'
UNDERLINE='\033[4m'



# Directory to hold the files
DIR_NAME="secured_scripts"

# URL locations for the files on GitLab or GitHub Pages
SCRIPT_URL="https://sachita007.github.io/TestScript/script.js.enc"
VERSION_URL="https://sachita007.github.io/TestScript/version.json"

# Derive the variable name from the script name
#VAR_NAME=$(basename "$0" .sh)
VAR_NAME="key001"
echo "${VAR_NAME}"

# Fetch the key from the derived environment variable
DECRYPTION_KEY="${!VAR_NAME}"

# Function to display a message in green
info_msg() {
    echo -e "${GREEN}${BOLD}$1${NC}"
}

# Function to display a warning in yellow
warning_msg() {
    echo -e "${YELLOW}${BOLD}$1${NC}"
}

# Function to display an error in red
error_msg() {
    echo -e "${RED}${BOLD}$1${NC}"
}




# Check if the key variable is set
if [ -z "$DECRYPTION_KEY" ]; then
    error_msg "Error: The decryption key is not set."
    exit 1
fi

# Create the directory if it doesn't exist
if [ ! -d "$DIR_NAME" ]; then
    mkdir "$DIR_NAME"
fi

# Change to the directory
cd "$DIR_NAME"

# Function to download the encrypted script
download_script() {
    info_msg "Downloading the encrypted script..."
    wget -O script.js.enc $SCRIPT_URL
}

# Function to download the version file
download_version() {
    info_msg "Downloading the version file..."
    wget -O version.json $VERSION_URL
}

# Check if version.json exists
if [ ! -f version.json ]; then
    warning_msg "Version file not found!"
    download_version
    download_script
else
    # Check for a version change
    CURRENT_VERSION=$(cat version.json | grep version | awk -F '"' '{print $4}')
    download_version
    NEW_VERSION=$(cat version.json | grep version | awk -F '"' '{print $4}')

    if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
        info_msg "Version has changed from $CURRENT_VERSION to $NEW_VERSION. Updating script..."
        download_script
    else
        info_msg "You already have the latest version of the script."
    fi
fi

# Check if script.js.enc exists, if not, download
if [ ! -f script.js.enc ]; then
    warning_msg "Encrypted script not found!"
    download_script
fi

# Decrypt the file
openssl enc -aes-256-cbc -d -in script.js.enc -out script.js -k $DECRYPTION_KEY

# Execute the Node.js script
info_msg "Executing the script..."
node script.js
