const { desEncrypt, desDecrypt, pkcs7Pad, pkcs7Unpad } = require('./des.js');
const crypto = require("crypto");

function utf8ToHex(str) {
    let utf8Arr = [];
    for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode < 0x80) {
            utf8Arr.push(charCode);
        } else if (charCode < 0x800) {
            utf8Arr.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
        } else if (charCode < 0xd800 || charCode >= 0xe000) {
            utf8Arr.push(
                0xe0 | (charCode >> 12),
                0x80 | ((charCode >> 6) & 0x3f),
                0x80 | (charCode & 0x3f)
            );
        } else {
            i++;
            charCode = 0x10000 + ((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff);
            utf8Arr.push(
                0xf0 | (charCode >> 18),
                0x80 | ((charCode >> 12) & 0x3f),
                0x80 | ((charCode >> 6) & 0x3f),
                0x80 | (charCode & 0x3f)
            );
        }
    }
    return utf8Arr.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToUtf8(hex) {
    let bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    let str = '';
    for (let i = 0; i < bytes.length; i++) {
        let byte = bytes[i];
        if ((byte & 0x80) === 0) {
            str += String.fromCharCode(byte);
        } else if ((byte & 0xe0) === 0xc0) {
            let charCode = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
            str += String.fromCharCode(charCode);
            i += 1;
        } else if ((byte & 0xf0) === 0xe0) {
            let charCode = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
            str += String.fromCharCode(charCode);
            i += 2;
        } else if ((byte & 0xf8) === 0xf0) {
            let charCode = ((byte & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
            if (charCode > 0xffff) {
                charCode -= 0x10000;
                str += String.fromCharCode(0xd800 | (charCode >> 10), 0xdc00 | (charCode & 0x3ff));
            } else {
                str += String.fromCharCode(charCode);
            }
            i += 3;
        }
    }

    return str;
}

function downloadAsFile(text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = "result.txt";
    a.click();

    // release the object URL
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}


function generateDESKeyFromPassword(password) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash.substr(0, 16); // get first 16 bytes
}

document.addEventListener("DOMContentLoaded", function() {
    const actionBtn = document.getElementById('actionBtn');
    const inputFile = document.getElementById('fileUpload');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const desKeyInput = document.getElementById('desKey');
    const useHexKeyCheckbox = document.getElementById('useHexKey');
    const textModeBtn = document.getElementById('textModeBtn');
    const fileModeBtn = document.getElementById('fileModeBtn');
    const fileCard = document.getElementById('fileCard');
    const textCard = document.getElementById('textCard');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearTextBtn = document.getElementById('clearTextBtn');
    const clearFileBtn = document.getElementById('clearFileBtn');

    // default state
    clearTextBtn.disabled = true;
    clearFileBtn.disabled = true;
    downloadBtn.disabled = true;

    fileCard.style.display = 'block';
    textCard.style.display = 'none';
    fileModeBtn.classList.add('btn-primary');
    fileModeBtn.classList.remove('btn-secondary');
    textModeBtn.classList.add('btn-secondary');
    textModeBtn.classList.remove('btn-primary');

    // when user clicks the text mode button
    textModeBtn.addEventListener('click', function() {
        fileCard.style.display = 'none';
        textCard.style.display = 'block';
        textModeBtn.classList.add('btn-primary');
        textModeBtn.classList.remove('btn-secondary');
        fileModeBtn.classList.add('btn-secondary');
        fileModeBtn.classList.remove('btn-primary');

        // clear the file input
        inputFile.value = '';
        clearFileBtn.disabled = true;
    });

    // when user clicks the file mode button
    fileModeBtn.addEventListener('click', function() {
        fileCard.style.display = 'block';
        textCard.style.display = 'none';
        fileModeBtn.classList.add('btn-primary');
        fileModeBtn.classList.remove('btn-secondary');
        textModeBtn.classList.add('btn-secondary');
        textModeBtn.classList.remove('btn-primary');

        inputText.value = '';
    });

    // after text is entered, change the color of the button
    inputText.addEventListener('input', function() {
        if (inputText.value) {
            actionBtn.classList.remove('btn-secondary');
            actionBtn.classList.add('btn-primary');
        } else {
            actionBtn.classList.remove('btn-primary');
            actionBtn.classList.add('btn-secondary');
        }
    });

    // the switch to toggle between encrypt and decrypt
    const actionSwitch = document.getElementById('actionSwitch');
    let isEncryptMode = true; // default is encrypt mode

    // listen to the switch change event
    actionSwitch.addEventListener('change', function() {
        isEncryptMode = !actionSwitch.checked;
    });

    // when user clicks the action button, the -> button
    actionBtn.addEventListener('click', function() {
        if (inputFile.files.length) {
            const file = inputFile.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileContent = e.target.result;
                let actualDESKey;
                if (useHexKeyCheckbox.checked) {
                    if (desKeyInput.value.length !== 16) {
                        alert("Please make sure the key is 16 bytes long!");
                        return;
                    }
                    actualDESKey = desKeyInput.value;
                } else {
                    if (!desKeyInput.value) {
                        alert("Please enter a password!");
                        return;
                    }
                    actualDESKey = generateDESKeyFromPassword(desKeyInput.value);
                }
                if (isEncryptMode) {
                    console.log("ENCRYPTING FILE CONTENT");
                    let hexText = utf8ToHex(fileContent);
                    let paddedHexText = pkcs7Pad(hexText);
                    const encryptedText = desEncrypt(paddedHexText, actualDESKey);
                    outputText.value = encryptedText;
                    console.log(encryptedText);
                } else {
                    console.log("DECRYPTING FILE CONTENT");
                    const decryptedHexText = desDecrypt(fileContent, actualDESKey);
                    const decryptedText = hexToUtf8(decryptedHexText);
                    outputText.value = decryptedText;
                    console.log(decryptedText);
                }
            };
            reader.onerror = function() {
                alert('Failed to read file!');
            };
            reader.readAsText(file);
        } else {
            let text = inputText.value;
            if (text) {
                let actualDESKey;
                if (useHexKeyCheckbox.checked) {
                    if (desKeyInput.value.length !== 16) {
                        alert("Please make sure the key is 16 bytes long!");
                        return;
                    }
                    actualDESKey = desKeyInput.value;
                } else {
                    if (!desKeyInput.value) {
                        alert("Please enter a password!");
                        return;
                    }
                    actualDESKey = generateDESKeyFromPassword(desKeyInput.value);
                }
                if (isEncryptMode) {
                    console.log("ENCRYPTING");
                    let hexText = utf8ToHex(text);
                    let paddedHexText = pkcs7Pad(hexText);
                    const encryptedText = desEncrypt(paddedHexText, actualDESKey);
                    outputText.value = encryptedText;
                    console.log(encryptedText);
                } else {
                    console.log("DECRYPTING");
                    const decryptedHexText = desDecrypt(text, actualDESKey);
                    const decryptedText = hexToUtf8(decryptedHexText);
                    outputText.value = decryptedText;
                    console.log(decryptedText);
                }
            } else {
                alert('Input text cannot be empty!');
            }
        }
        downloadBtn.disabled = !outputText.value;
    });


    // the input text area
    inputText.addEventListener('input', function() {
        clearTextBtn.disabled = !inputText.value;
        if (inputText.value) {
            actionBtn.classList.remove('btn-secondary');
            actionBtn.classList.add('btn-primary');
        } else {
            actionBtn.classList.remove('btn-primary');
            actionBtn.classList.add('btn-secondary');
        }
    });

    // the clear text button
    clearTextBtn.addEventListener('click', function() {
        inputText.value = '';
        clearTextBtn.disabled = true;
        actionBtn.classList.remove('btn-primary');
        actionBtn.classList.add('btn-secondary');
    });

    // check if file is selected
    inputFile.addEventListener('change', function() {
        // enable the clear file button if a file is selected
        clearFileBtn.disabled = !inputFile.files.length;
    });

    // the clear file button
    clearFileBtn.addEventListener('click', function() {
        inputFile.value = '';
        clearFileBtn.disabled = true;
    });

    // the download button
    downloadBtn.addEventListener('click', function() {
        downloadAsFile(outputText.value);
    });
});
