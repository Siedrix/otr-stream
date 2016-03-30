// if(typeof window === 'undefined'){
	var forge = require('node-forge')
// }

var cryptoTools = {}

cryptoTools.loadPublicKey = function (keyAsString) {
	return forge.pki.publicKeyFromPem(keyAsString)
}

cryptoTools.loadPrivateKey = function (keyAsString) {
	return forge.pki.privateKeyFromPem(keyAsString)
}

cryptoTools.createMessage = function (msg, keys) {
	var message = {}

	// Pass json to string
	var stringifiedMsg = JSON.stringify(msg)

	// Creates salt, password, key and iv
	var keySize = 16
	var salt = forge.random.getBytes(8)
	var password = forge.random.getBytes(24)
	var passwordAsHex = forge.util.bytesToHex(password)
	var key = forge.pkcs5.pbkdf2(passwordAsHex, salt, 1000, keySize)
	var iv = forge.random.getBytes(16)

	// ciphers message
	var input = forge.util.createBuffer(stringifiedMsg, 'utf8')
	var cipher = forge.cipher.createCipher('AES-CBC', key)
	cipher.start({iv: iv})
	cipher.update(input)
	cipher.finish()
	message.content = cipher.output.toHex()

	// creates cipherKey
	var ivAsHex = forge.util.bytesToHex(iv)
	var saltAsHex = forge.util.bytesToHex(salt)
	var cipherKey = ivAsHex+':'+saltAsHex+':'+passwordAsHex

	// creates recipients array of encripted cipherKey
	message.recipients = []
	keys.forEach((key)=>{
		var recipient = {}

		var encryptedKey = key.encrypt(cipherKey)
		recipient.messageKey = forge.util.bytesToHex(encryptedKey)
		recipient.fingerprint = forge.ssh.getPublicKeyFingerprint(key, {encoding: 'hex', delimiter: ':'})

		message.recipients.push(recipient)
	})

	return message
}

cryptoTools.decryptMessage = function (encryptedMsg, privateKey) {
	var msg = forge.util.createBuffer( forge.util.hexToBytes( encryptedMsg.content ) )

	var msgKey = forge.util.hexToBytes(encryptedMsg.messageKey)
	msgKey = privateKey.decrypt(msgKey)	

	var iv = forge.util.hexToBytes( msgKey.split(':')[0] )
	var salt = forge.util.hexToBytes( msgKey.split(':')[1] )
	var password = msgKey.split(':')[2]

	var keySize = 16;
	var key = forge.pkcs5.pbkdf2(password, salt, 1000, keySize)

	var decipher = forge.cipher.createDecipher('AES-CBC', key)
	decipher.start({iv: iv})
	decipher.update( msg )
	decipher.finish()

	return JSON.parse(decipher.output.toString('utf8'))	
}

module.exports = cryptoTools