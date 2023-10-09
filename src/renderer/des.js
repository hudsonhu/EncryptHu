const {IP, IP_INV, PC1, PC2, P, E, S} = require('./constants');

function generateSubkeys(key) {
    let keys = [];
    let C = permute(key, PC1).slice(0, 28);  // Initial permutation and split
    let D = permute(key, PC1).slice(28, 56);

    const rotations = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

    for (let i = 0; i < 16; i++) {
        C = rotateLeft(C, rotations[i]);
        D = rotateLeft(D, rotations[i]);
        keys.push(permute(C.concat(D), PC2));
    }

    return keys;
}

function permute(input, table) {
    // permute input bits according to table
    let output = [];
    for (let i = 0; i < table.length; i++) {
        output.push(input[table[i] - 1]);
    }
    return output;
}

function rotateLeft(block, count) {
    return block.slice(count).concat(block.slice(0, count));
}


function initialPermutation(plaintext) {
    return permute(plaintext, IP);
}

function iterate_16(plaintext, keys, encrypt = true) {
    let L = plaintext.slice(0, 32);
    let R = plaintext.slice(32, 64);

    let newL, newR;
    if (!encrypt) {
        keys = [...keys].reverse();
    }

    for (let i = 0; i < 16; i++) {
        newR = xor(L, f(R, keys[i]));
        newL = R;
        R = newR;
        L = newL;
    }
    return R.concat(L);
}



function generateKey(key) {
    key = hexToBinary(key);
    key = permutation(key, pc1);
    return key;
}


function generateRandomKeyWithParity() {
    let key = [];

    for (let i = 0; i < 8; i++) {
        let bits = [];
        for (let j = 0; j < 7; j++) {
            bits.push(Math.random() < 0.5 ? 0 : 1);
        }

        // check parity
        bits.push(countOnes(bits) % 2 === 0 ? 1 : 0);

        key = key.concat(bits);
    }

    return key;
}

function countOnes(bits) {
    return bits.reduce((acc, bit) => acc + bit, 0);
}


function xor(block1, block2) {
    return block1.map((bit, index) => bit ^ block2[index]);
}


function f(block, key) {
    let expandedBlock = permute(block, E);  // expand to 48 bits
    // console.log("expandedBlock: ", expandedBlock);
    let temp = xor(expandedBlock, key);  // E(R) xor K
    let sBoxOutput = [];

    // split into 8 groups of 6 bits
    // S-box
    for (let i = 0; i < 8; i++) {
        let currentStart = i * 6;
        let row = temp[currentStart] * 2 + temp[currentStart + 5];  // first and last bit, converted to decimal
        let col = temp[currentStart + 1] * 8 + temp[currentStart + 2] * 4 + temp[currentStart + 3] * 2 + temp[currentStart + 4];
        let val = S[i][row][col];
        let bin = val.toString(2).padStart(4, '0').split('').map(Number);
        sBoxOutput = sBoxOutput.concat(bin);
    }
    // console.log("sBoxOutput: ", sBoxOutput);
    let result = permute(sBoxOutput, P);
    // console.log("result: ", result);
    return result;
}

/**
 * Encrypt plaintext block with DES
 * @param plaintext - binary string
 * @param subkeys - array of 16 48-bit keys
 * @returns {*[]}
 */
function desEncryptBlock(plaintext, subkeys) {
    // plaintext: binary string
    // subkeys: array of 16 48-bit keys
    plaintext = initialPermutation(plaintext);
    // console.log(plaintext);
    let encryptedText = iterate_16(plaintext, subkeys);
    encryptedText = permute(encryptedText, IP_INV);
    // console.log(encryptedText);
    return encryptedText;
}


/**
 * Encrypt plaintext with DES
 *
 * @param {string} plaintextHex - Hexadecimal string representing the plaintext.
 * @param {string} keyHex - Hexadecimal string representing the 64-bit key.
 * @returns {*[]}
 */
function desEncrypt(plaintextHex, keyHex) {
    validateKey(keyHex);
    validateData(plaintextHex)
    // Convert hex to binary
    const plaintext = hexToBinary(plaintextHex);
    console.log(plaintext)
    const key = hexToBinary(keyHex).split('').map(bit => parseInt(bit, 10));  // Convert string bits to numbers
    let subkeys = generateSubkeys(key);

    // cut plaintext into 64-bit blocks
    let blocks = [];
    for (let i = 0; i < plaintext.length; i += 64) {
        blocks.push(plaintext.slice(i, i + 64));
    }

    // process each block
    let block;
    for (let i = 0; i < blocks.length; i++) {
        block = desEncryptBlock(blocks[i], subkeys);
        block = block.join('');
        blocks[i] = block;
    }

    // convert blocks to hex
    blocks = blocks.map(binaryToHex);
    let encrypted_result = blocks.join('');
    // console.log(encrypted_result);
    return encrypted_result;
}


function desDecryptBlock(ciphertext, subkeys) {
    ciphertext = initialPermutation(ciphertext);
    let decryptedText = iterate_16(ciphertext, subkeys, false);
    decryptedText = permute(decryptedText, IP_INV);
    return decryptedText;
}

function desDecrypt(ciphertextHex, keyHex) {
    validateKey(keyHex);
    // Convert hex to binary
    const ciphertext = hexToBinary(ciphertextHex);
    const key = hexToBinary(keyHex).split('').map(bit => parseInt(bit, 10));  // Convert string bits to numbers
    let subkeys = generateSubkeys(key);

    // cut ciphertext into 64-bit blocks
    let blocks = [];
    for (let i = 0; i < ciphertext.length; i += 64) {
        blocks.push(ciphertext.slice(i, i + 64));
    }

    // process each block
    let block;
    for (let i = 0; i < blocks.length; i++) {
        block = desDecryptBlock(blocks[i], subkeys);
        block = block.join('');
        blocks[i] = block;
    }

    // convert blocks to hex
    blocks = blocks.map(binaryToHex);
    let decrypted_result = blocks.join('');
    return decrypted_result;
}

/**
 * Convert a hexadecimal string to its binary representation.
 *
 * @param {string} hex - hexadecimal string to be converted.
 * @returns {string} binary representation of hex
 */
function hexToBinary(hex) {
    return hex.split('').map((char) => parseInt(char, 16).toString(2).padStart(4, '0')).join('');
}

function binaryToHex(binary) {
    return binary.match(/.{1,4}/g).map((bin) => parseInt(bin, 2).toString(16)).join('');
}

function validateKey(keyHex) {
    if (keyHex.length !== 16) { // 16 hex digits = 64 bits
        throw new Error('Invalid key length. Key must be a 64-bit hexadecimal string.');
    }
}

function validateData(dataHex) {
    if (dataHex.length % 16 !== 0) { // 16 hex digits = 64 bits
        throw new Error('Invalid data length. Data must be a multiple of 64 bits.');
    }
}

function pkcs5Pad(data) {
    const padLength = 8 - (data.length / 2) % 8;
    console.log("data to pad: ", data);
    console.log("padLength: ", padLength);
    const padByte = padLength.toString(16).padStart(2, '0');
    console.log("padByte: ", padByte);
    const padding = padByte.repeat(padLength);
    console.log("padded: ", data + padding);
    return data + padding;
}

function validatePKCS5Padding(data) {
    const lastByte = parseInt(data.slice(-2), 16);
    const expectedPadding = lastByte.toString(16).padStart(2, '0').repeat(lastByte);
    if (data.slice(-lastByte * 2) !== expectedPadding) {
        throw new Error('Invalid PKCS5 padding.');
    }
}

function pkcs5Unpad(data) {
    validatePKCS5Padding(data)
    const lastByte = parseInt(data.slice(-2), 16);
    return data.slice(0, -lastByte * 2);
}


module.exports = {
    desEncrypt,
    desDecrypt,
    pkcs5Pad,
    pkcs5Unpad
};
