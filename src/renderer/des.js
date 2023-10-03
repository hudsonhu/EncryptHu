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

function iterate_16(plaintext, keys) {
    let L = plaintext.slice(0, 32);
    let R = plaintext.slice(32, 64);

    for (let i = 0; i < 16; i++) {
        let newR = xor(L, f(R, keys[i]));
        L = R;
        R = newR;
    }

    return R.concat(L); // R+L
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
    let temp = xor(expandedBlock, key);
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

    return permute(sBoxOutput, P);
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
    let encryptedText = iterate_16(plaintext, subkeys);
    encryptedText = permute(encryptedText, IP_INV);
    return encryptedText;
}


/**
 * Encrypt plaintext with DES
 * @param {string} plaintext - binary string
 * @param {number[]} key - 64-bit binary array
 * @returns {*[]}
 */
function desEncrypt(plaintext, key) {
    let subkeys = generateSubkeys(key);

    // cut plaintext into 64-bit blocks
    let blocks = [];
    for (let i = 0; i < plaintext.length; i += 64) {
        blocks.push(plaintext.slice(i, i + 64));
    }

    // process each block
    for (let i = 0; i < blocks.length; i++) {
        block = desEncryptBlock(blocks[i], subkeys);
        block = block.join('');

    }
}


function hexToBinary(hex) {
    return hex.split('').map((char) => parseInt(char, 16).toString(2).padStart(4, '0')).join('');
}


module.exports = {
    desEncrypt,
    generateRandomKeyWithParity,
};
