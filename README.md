# TestScritp

###### Download the encrypted script from GitLab Pages
```bash
wget https://sachita007.github.io/TestScript/script.js.enc
```

###### Download the version.json file from GitLab Pages
```bash
wget https://sachita007.github.io/TestScript/version.json
```



This repository provides a way to securely distribute an encrypted Node.js script to users via GitHub. The `key001.sh` script helps in the decryption and execution process.

## Setup:

1. **Generate a Secret Key**:
    You can generate a strong secret key using OpenSSL:
    ```bash
    openssl rand -base64 32
    ```

2. **Encrypt Your Node.js Script**:
    ```bash
    openssl enc -aes-256-cbc -in script.js -out script.js.enc -k your_secret_key_here
    ```

3. **Repository Configuration**:
    - Place the encrypted file `script.js.enc` in your repository.
    - Include the `key001.sh` script provided in this repository.
    - Include a `version.json` for version control.

4. **GitHub Pages**:
    - Push the necessary files to the `gh-pages` branch for GitHub.

## User Instructions:

1. Set the decryption key:
    ```bash
    export key0001=provided_secret_key
    ```

2. Download and execute:
    **Using wget (GitHub)**:
      ```bash
      wget -O - https://sachita007.github.io/TestScript/key001.sh | bash
      ```



