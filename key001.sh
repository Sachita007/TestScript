#!/bin/bash

# Derive the variable name from the script name
VAR_NAME=$(basename "$0" .sh)

# Fetch the key from the derived environment variable
DECRYPTION_KEY="${!VAR_NAME}"

# Check if the key variable is set
if [ -z "$DECRYPTION_KEY" ]; then
    echo "Error: The decryption key is not set."
    exit 1
fi

# Download the encrypted script from GitLab Pages
wget https://sachita007.github.io/TestScript/script.js.enc

# Download the version.json file from GitLab Pages
wget https://sachita007.github.io/TestScript/version.json

# (Optional) Display the version info for user awareness
echo "Downloaded script version:"
cat version.json

# Decrypt the file using the provided symmetric key
openssl enc -aes-256-cbc -d -in myscript.js.enc -out myscript.js -k $DECRYPTION_KEY

# Optionally, execute the Node.js script
node myscript.js
