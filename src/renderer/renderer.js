const { desEncrypt } = require('./des.js');
const { pkcs7Pad } = require("./des");

function utf8ToHex(str) {
    return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
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
            } else {
                console.warn('No text to encrypt.');
            }
        }
    });
});
