/* global Backbone */
/* global _ */
var cryptoTools = require('../../lib/crypto-tools')
var _ = require('underscore')

var UserKeys = Backbone.Model.extend({
	initialize: function(){
		this.fetch()

		if( !this.get('fingerprint') ){
			this.createNew()
			this.save()
		}
	},

	// Get data into localstorage
	fetch: function(){
		var keypair = JSON.parse(localStorage.getItem('keypair'))

		if( _.isEmpty(keypair) ){return;}

		this.set('privateKey', forge.pki.privateKeyFromPem(keypair.privateKey), 72 )
		this.set('publicKey', forge.pki.publicKeyFromPem(keypair.publicKey), 72 )

		this.set('fingerprint', keypair.fingerprint )
	},

	// Create new set of keys
	createNew: function(){
		var keypair = forge.rsa.generateKeyPair({bits: 1024, e: 0x10001})

		this.set('privateKey', keypair.privateKey)
		this.set('publicKey', keypair.publicKey)

		this.set('fingerprint', forge.ssh.getPublicKeyFingerprint(keypair.publicKey, {encoding: 'hex', delimiter: ':'}) )
	},

	// Set new keys from pem format
	load: function(){},

	// Persist data into localstorage
	save: function(){
		var data = this.toJSON()

		if( _.isEmpty(data) ){return;}

		var privateKey = forge.pki.privateKeyToPem(data.privateKey, 72)
		var publicKey = forge.pki.publicKeyToRSAPublicKeyPem(data.publicKey, 72)

		var persistData = {
			privateKey: privateKey,
			publicKey: publicKey,
			fingerprint: data.fingerprint
		}

		localStorage.setItem('keypair', JSON.stringify(persistData) )
	},

	// Removes keypair from current data or localstorage
	destroy: function(){
		keys.attributes = {}
		localStorage.setItem('keypair', JSON.stringify({}) )
	},

	privateKeyToPem: function(){
		var privateKey = this.get('privateKey')

		return forge.pki.privateKeyToPem(privateKey, 72)
	},
	publicKeyToPem: function(){
		var publicKey = this.get('privateKey')

		return forge.pki.publicKeyToRSAPublicKeyPem(publicKey, 72)
	},
	fetchMessages: function(){
		var privateKey = this.get('privateKey')
		var self = this

		var xhr = $.get( '/messages/'+this.get('fingerprint') )

		xhr.done(function(messages){
			var msgs = []

			messages.forEach(function(message){
				var msg = cryptoTools.decryptMessage(message, privateKey)
				msg.date = new Date(message.createdAt)

				msgs.push(msg)
			})

			self.set('messages', msgs.reverse())
		})

		xhr.fail(function(){
			console.log('Fail')
		})

		return xhr
	}
})

module.exports = UserKeys