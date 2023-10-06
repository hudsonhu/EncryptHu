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


function generateDESKeyFromPassword(password) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash.substr(0, 16); // 获取前16个字符
}

document.addEventListener("DOMContentLoaded", function() {
    const actionBtn = document.getElementById('actionBtn');
    const inputFile = document.getElementById('fileUpload');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const desKeyInput = document.getElementById('desKey');
    const useHexKeyCheckbox = document.getElementById('useHexKey');
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

        // 清空已上传的文件
        inputFile.value = '';
        clearFileBtn.disabled = true; // 内容已被清除，所以禁用按钮
    });

// 当点击"文件"按钮
    fileModeBtn.addEventListener('click', function() {
        fileCard.style.display = 'block';
        textCard.style.display = 'none';
        fileModeBtn.classList.add('btn-primary');
        fileModeBtn.classList.remove('btn-secondary');
        textModeBtn.classList.add('btn-secondary');
        textModeBtn.classList.remove('btn-primary');

        // 清空已输入的文本
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

    // 加密/解密选择器的引用
    const actionSwitch = document.getElementById('actionSwitch');

    // 当前的操作状态，true代表加密，false代表解密
    let isEncryptMode = true; // 默认为加密模式

    // 监听加密/解密选择器的状态改变
    actionSwitch.addEventListener('change', function() {
        isEncryptMode = !actionSwitch.checked; // 切换模式
    });

    actionBtn.addEventListener('click', function() {
        if (inputFile.files.length) {
            const file = inputFile.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB
                alert('文件太大，不能超过10MB!');
                return;
            }

            if (!file.type.startsWith('text')) {
                alert('只支持文本文件！');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const fileContent = e.target.result;
                let actualDESKey;
                if (useHexKeyCheckbox.checked) {
                    if (desKeyInput.value.length !== 16) {
                        alert("请确保密钥为16个字符的Hex格式！");
                        return;
                    }
                    actualDESKey = desKeyInput.value;
                } else {
                    if (!desKeyInput.value) {
                        alert("请确保密钥不为空！");
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
                alert('文件读取出错！');
            };
            reader.readAsText(file);
        } else {
            let text = inputText.value;
            if (text) {
                let actualDESKey;
                if (useHexKeyCheckbox.checked) {
                    if (desKeyInput.value.length !== 16) {
                        alert("请确保密钥为16个字符的Hex格式！");
                        return;
                    }
                    actualDESKey = desKeyInput.value;
                } else {
                    // 检查密钥是否为空
                    if (!desKeyInput.value) {
                        alert("请确保密钥不为空！");
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
                alert('输入不能为空');
            }
        }
    });

    // 获取清除按钮
    const clearTextBtn = document.getElementById('clearTextBtn');
    const clearFileBtn = document.getElementById('clearFileBtn');

    // 默认禁用清除按钮
    clearTextBtn.disabled = true;
    clearFileBtn.disabled = true;

    // 监听inputText的内容变化
    inputText.addEventListener('input', function() {
        // 如果inputText有内容，启用清除按钮；否则禁用
        clearTextBtn.disabled = !inputText.value;

        // 更新actionBtn的状态
        if (inputText.value) {
            actionBtn.classList.remove('btn-secondary');
            actionBtn.classList.add('btn-primary');
        } else {
            actionBtn.classList.remove('btn-primary');
            actionBtn.classList.add('btn-secondary');
        }
    });

    // 清除inputText内容
    clearTextBtn.addEventListener('click', function() {
        inputText.value = '';
        clearTextBtn.disabled = true; // 内容已被清除，所以禁用按钮
        actionBtn.classList.remove('btn-primary'); // 由于内容被清除，改变actionBtn的状态
        actionBtn.classList.add('btn-secondary');
    });

    // 监听文件上传控件的内容变化
    inputFile.addEventListener('change', function() {
        // 如果有选择的文件，启用清除按钮；否则禁用
        clearFileBtn.disabled = inputFile.files.length ? false : true;
    });

    // 清除文件上传控件的内容
    clearFileBtn.addEventListener('click', function() {
        inputFile.value = ''; // 清除选中的文件
        clearFileBtn.disabled = true; // 内容已被清除，所以禁用按钮
    });
});
