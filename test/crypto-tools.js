var fs = require('fs')
var assert = require('assert')
var _ = require('underscore')
var forge = require('node-forge')

var cryptoTools = require('../lib/crypto-tools')

var publicKey1 = cryptoTools.loadPublicKey( fs.readFileSync('./test/utils/public-key-1', 'utf-8') )
var privateKey1 = cryptoTools.loadPrivateKey( fs.readFileSync('./test/utils/private-key-1', 'utf-8') )
var fingerprint1 = forge.ssh.getPublicKeyFingerprint(publicKey1, {encoding: 'hex', delimiter: ':'})

var publicKey2 = cryptoTools.loadPublicKey( fs.readFileSync('./test/utils/public-key-2', 'utf-8') )
var fingerprint2 = forge.ssh.getPublicKeyFingerprint(publicKey2, {encoding: 'hex', delimiter: ':'})

var encryptedMessage = JSON.parse( fs.readFileSync('./test/utils/message.json', 'utf-8') )

describe('Crypto Tools', function() {
	describe('Messages', function(){
		it('Should create message', function(){
			var message = cryptoTools.createMessage({success: true}, [publicKey1, publicKey2])

			assert.equal(_.isArray(message.recipients), true)
			assert.equal(message.recipients.length, 2)

			var firstRecipient = message.recipients[0]
			assert.equal( firstRecipient.fingerprint , fingerprint1 )
			assert.equal(typeof firstRecipient.messageKey === 'string', true)
			
			var secondRecipient = message.recipients[1]
			assert.equal( secondRecipient.fingerprint , fingerprint2 )
			assert.equal(typeof firstRecipient.messageKey === 'string', true)

			assert.equal(typeof message.content === 'string', true)
		})

		it('Should decrypt message', function(){
			var message = cryptoTools.decryptMessage( encryptedMessage, privateKey1 )

			assert.equal(typeof message === 'object', true)
			assert.equal(message.success, true)
		})
	})
})