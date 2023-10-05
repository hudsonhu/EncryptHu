const { desEncrypt } = require('./des.js');
const {pkcs7Pad} = require("./des");

function utf8ToHex(str) {
    return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

document.addEventListener("DOMContentLoaded", function() {
    const encryptBtn = document.getElementById('encryptBtn');
    const inputFile = document.getElementById('fileUpload');
    const inputText = document.getElementById('inputText');
    const encryptedTextOutput = document.getElementById('encryptedTextOutput');

    let testKey = '133457799BBCDFF1';

    encryptBtn.addEventListener('click', function() {
        if (inputFile.files.length) {
            // TODO: read file
        } else {
            let textToEncrypt = inputText.value;
            if (textToEncrypt) {
                // Convert from UTF-8 to Hex
                console.log("Text to encrypt: " + textToEncrypt)
                let hexText = utf8ToHex(textToEncrypt);
                console.log("Hex text: " + hexText);
                // Pad using PKCS7
                let paddedHexText = pkcs7Pad(hexText);
                console.log("Padded hex text: " + paddedHexText);
                const encryptedText = desEncrypt(paddedHexText, testKey);
                encryptedTextOutput.value = encryptedText; // update text box
            } else {
                console.warn('No text to encrypt.');
            }
        }
    });

});
