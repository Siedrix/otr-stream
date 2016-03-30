var React = require('react')
var ReactDOM = require('react-dom')

var cryptoTools = require('../lib/crypto-tools')
var wrappr = require('../lib/wrappr')

var UserKeys = require('./datalayer/user-keys')
var KeyRing = require('./datalayer/key-ring')

var keys = new UserKeys()
keys.fetchMessages()

var keyRing = new KeyRing()

// Show in document ssh keys
var privateKey = keys.privateKeyToPem()
var publicKey = keys.publicKeyToPem()

$('#private-key').text(privateKey)
$('#public-key').text(publicKey)

$('#add-key').on('click', function(){
	var key = $('#key').val().trim()
	var name = $('#keyname').val().trim()
	if(!key || !name){
		return alert('You need a key and a name')
	}

	keyRing.add({
		name: name,
		key: key
	})
})



window.Data= {
	KeyRing : KeyRing,
	UserKeys : UserKeys
}

window.keyRing = keyRing
window.keys = keys