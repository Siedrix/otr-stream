// var forge = require('node-forge')
// var Backbone = require('backbone')
var React = require('react')
var ReactDOM = require('react-dom')

var Keys = Backbone.Model.extend({
	initialize: function(){
		var keypairStore = localStorage.getItem('keypair')

		if(keypairStore){
			keypairStore = JSON.parse(keypairStore)
		}else{
			var keypair = forge.rsa.generateKeyPair({bits: 1024, e: 0x10001})

			this.set('privateRSAkey', keypair.privateKey)
			this.set('publicRSAkey', keypair.publicKey)

			debugger;
			this.set('fingerprint', forge.ssh.getPublicKeyFingerprint(keypair.publicKey, {encoding: 'hex', delimiter: ':'}) )
		}
	},

	fetch: function(){},
	load: function(){},
	save: function(){},
	destroy: function(){}
})

var keys = new Keys()

// Globlas
var peerId
var socket

// Create ssh keys
var keypair = forge.rsa.generateKeyPair({bits: 1024, e: 0x10001})
var privateRSAkey = forge.pki.privateKeyToPem(keypair.privateKey, 72)
var publicRSAkey = forge.pki.publicKeyToRSAPublicKeyPem(keypair.publicKey, 72)

$('#private-key').text(privateRSAkey)
$('#public-key').text(publicRSAkey)

$('#add-key').on('click', function(){
	var key = $('#key').val().trim()
	var name = $('#keyname').val().trim()
	if(!key || !name){
		return alert('You need a key and a name')
	}

	try{
		var pk = forge.pki.publicKeyFromPem(key)
	}catch(e){
		return alert('Invalid key')
	}

	// console.log('Key found', pk)

	socket.emit('join', encryptMessage(pk,{
		text: 'Welcome',
		pk: publicRSAkey
	}) )
})

var encryptMessage = function(publicKey, msg){
	var stringifiedMsg = JSON.stringify(msg)

	var keySize = 16
	var salt = forge.random.getBytes(8)
	var password = forge.random.getBytes(24)
	var passwordAsHex = forge.util.bytesToHex(password)
	var key = forge.pkcs5.pbkdf2(passwordAsHex, salt, 1000, keySize)
	var iv = forge.random.getBytes(16)
	var input = forge.util.createBuffer(stringifiedMsg, 'utf8')
	var cipher = forge.cipher.createCipher('AES-CBC', key)
	cipher.start({iv: iv})
	cipher.update(input)
	cipher.finish()
	var ciphertext = cipher.output.toHex()

	var ivAsHex = forge.util.bytesToHex(iv)
	var saltAsHex = forge.util.bytesToHex(salt)
	console.log('Key:', key)
	console.log('Key',ivAsHex+':'+saltAsHex+':'+passwordAsHex)
	console.log('Key',iv+':'+salt+':'+password)
	console.log('Message',ciphertext)
	console.log('Message',cipher.output)


	encryptedKey = publicKey.encrypt(ivAsHex+':'+saltAsHex+':'+passwordAsHex)

	return {
		key: forge.util.bytesToHex(encryptedKey),
		msg: ciphertext,
		fingerprint: forge.ssh.getPublicKeyFingerprint(keypair.publicKey, {encoding: 'hex', delimiter: ':'})
	}
}

var decryptMessage = function(data){
	var cipherKey = data.key
	var cipherMessage = data.msg

	var msg = forge.util.createBuffer( forge.util.hexToBytes( cipherMessage ) )

	var msgKey = forge.util.hexToBytes(cipherKey)
	msgKey = keypair.privateKey.decrypt(msgKey)

	var iv = forge.util.hexToBytes( msgKey.split(':')[0] )
	var salt = forge.util.hexToBytes( msgKey.split(':')[1] )
	var password = msgKey.split(':')[2]

	console.log(iv,salt,password, cipherMessage)

	var keySize = 16;
	var key = forge.pkcs5.pbkdf2(password, salt, 1000, keySize)

	var decipher = forge.cipher.createDecipher('AES-CBC', key)
	decipher.start({iv: iv})
	decipher.update( msg )
	decipher.finish()
	console.log(decipher.output.toString('utf8'))

	return JSON.parse(decipher.output.toString('utf8'))
}

// SocketIo logic
var connectToSocketIo = function(){
	socket = io.connect()
	window.socket = socket

	socket.on('connect', function () {
		// var msg = JSON.stringify({key:publicRSAkey, channel: peer.id})
		// socket.emit('join', encryptMessage(keypair.publicKey,msg) )

		socket.on('message', function(data){
			console.log('message', data.fingerprint)
			
			var msg =decryptMessage(data)
			console.log(msg);
		})

		socket.on('user-connected', function(data){
			console.log('user-connected', data.fingerprint)

			var msg = decryptMessage(data)
			console.log(msg);
		})
	});	
}

connectToSocketIo()

window.socket = socket

window.keys = keys

window.keypair = keypair
window.privateRSAkey = privateRSAkey
window.publicRSAkey = publicRSAkey
window.encryptMessage = encryptMessage