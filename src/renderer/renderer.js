const { desEncrypt } = require('./des.js');
const { pkcs7Pad } = require("./des");

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

document.addEventListener("DOMContentLoaded", function() {
    const actionBtn = document.getElementById('actionBtn');
    const inputFile = document.getElementById('fileUpload');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    // 获取元素
    // 获取元素
    const textModeBtn = document.getElementById('textModeBtn');
    const fileModeBtn = document.getElementById('fileModeBtn');
    const fileCard = document.getElementById('fileCard');
    const textCard = document.getElementById('textCard');

// 默认状态
    fileCard.style.display = 'block';
    textCard.style.display = 'none';
    fileModeBtn.classList.add('btn-primary');
    fileModeBtn.classList.remove('btn-secondary');
    textModeBtn.classList.add('btn-secondary');
    textModeBtn.classList.remove('btn-primary');
// 当点击"文本"按钮
    textModeBtn.addEventListener('click', function() {
        fileCard.style.display = 'none';
        textCard.style.display = 'block';
        textModeBtn.classList.add('btn-primary');
        textModeBtn.classList.remove('btn-secondary');
        fileModeBtn.classList.add('btn-secondary');
        fileModeBtn.classList.remove('btn-primary');
    });

// 当点击"文件"按钮
    fileModeBtn.addEventListener('click', function() {
        fileCard.style.display = 'block';
        textCard.style.display = 'none';
        fileModeBtn.classList.add('btn-primary');
        fileModeBtn.classList.remove('btn-secondary');
        textModeBtn.classList.add('btn-secondary');
        textModeBtn.classList.remove('btn-primary');
    });

    let testKey = '133457799BBCDFF1';

    actionBtn.addEventListener('click', function() {
        if (inputFile.files.length) {
            // TODO: read file
        } else {
            let textToEncrypt = inputText.value;
            if (textToEncrypt) {
                // Convert from UTF-8 to Hex
                let hexText = utf8ToHex(textToEncrypt);
                // Pad using PKCS7
                let paddedHexText = pkcs7Pad(hexText);
                const encryptedText = desEncrypt(paddedHexText, testKey);
                outputText.value = encryptedText; // update text box
                console.log(encryptedText);
            } else {
                console.warn('No text to encrypt.');
            }
        }
    });
});
