const EC = require('elliptic').ec; 
const cryptoHash = require('./crypto-hash')

const ec = new EC('secp256k1')

const verifySignature = ({publicKey, data, signature}) => {
    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');

    return keyFromPublic.verify(cryptoHash(data) , signature);


}

module.exports = {ec, verifySignature, cryptoHash};

//standards of effcicent cryographic prime 256 koblits 1 is very first implementation 