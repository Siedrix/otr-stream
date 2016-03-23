var keySize = 16;
var salt = forge.random.getBytes(8);  
var password = forge.random.getBytes(16);
var passwordAsHex = forge.util.bytesToHex(password)
var key = forge.pkcs5.pbkdf2(passwordAsHex, salt, 1000, keySize);
var iv = forge.random.getBytes(16);
var input = forge.util.createBuffer('plaintext', 'utf8');
var cipher = forge.cipher.createCipher('AES-CBC', key);
cipher.start({iv: iv});
cipher.update(input);
cipher.finish();
var ciphertext = cipher.output.toHex();

var ivAsHex = forge.util.bytesToHex(iv)
var saltAsHex = forge.util.bytesToHex(salt)
console.log(ivAsHex+':'+saltAsHex+':'+passwordAsHex);
console.log(ciphertext)


var msg = '2f3a00286b884581b8873ae1f2a0ad50:42c72c1baa6ddbdd:05c03ec0f73b017ef2e21c79073e0218'

var keySize = 16;
var iv = forge.util.hexToBytes(msg.split(':')[0])
var salt = forge.util.hexToBytes(msg.split(':')[1])
var input = forge.util.createBuffer( forge.util.hexToBytes(msg.split(':')[2]) );
var key = forge.pkcs5.pbkdf2('Secret Passphrase', salt, 1000, keySize);

var decipher = forge.cipher.createDecipher('AES-CBC', key);
decipher.start({iv: iv});
decipher.update(input);
decipher.finish();
console.log(decipher.output.toString('utf8'));