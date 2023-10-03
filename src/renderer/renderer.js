const { desEncrypt } = require('./des.js');

function textToBinary(text) {  // Transform text to binary representation(8-bit)
    const textEncoder = new TextEncoder();   // go UTF-8
    const byteArray = textEncoder.encode(text);

    let binaryStr = '';
    for (let byte of byteArray) {
        binaryStr += byte.toString(2).padStart(8, '0');  // go Binary
    }

    return binaryStr;
}

const text = "bad";
const binaryRepresentation = textToBinary(text);
console.log(binaryRepresentation);

function binaryToText(binaryStr) {  // Transform binary representation(8-bit) to text
    const byteCount = binaryStr.length / 8;
    const byteArray = new Uint8Array(byteCount);

    for (let i = 0; i < byteCount; i++) {
        const byteBinary = binaryStr.slice(i*8, (i+1)*8);
        byteArray[i] = parseInt(byteBinary, 2);
    }

    const textDecoder = new TextDecoder();   // go UTF-8
    return textDecoder.decode(byteArray);
}

// test
const textFromBinary = binaryToText(binaryRepresentation);
console.log(textFromBinary);



document.addEventListener("DOMContentLoaded", function() {
    const encryptBtn = document.getElementById('encryptBtn');
    const inputFile = document.getElementById('fileUpload');
    const inputText = document.getElementById('inputText');
    const encryptedTextOutput = document.getElementById('encryptedTextOutput');

    const testKey = [0,0,1,1,0,0,0,0, 0,0,1,1,0,0,0,1, 0,0,1,1,0,0,1,0, 0,0,1,1,0,0,1,1, 0,0,1,1,0,1,0,0, 0,0,1,1,0,1,0,1, 0,0,1,1,0,1,1,0, 0,0,1,1,0,1,1,1];

    encryptBtn.addEventListener('click', function() {
        if (inputFile.files.length) {
            // TODO: read file
        } else {
            let textToEncrypt = inputText.value;
            if (textToEncrypt) {
                textToEncrypt = textToBinary(textToEncrypt);  // go binary
                const encryptedText = desEncrypt(textToEncrypt, testKey);
                encryptedTextOutput.value = encryptedText; // update text box
            } else {
                console.warn('No text to encrypt.');
            }

        }
    });
});
