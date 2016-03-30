/* global Backbone */
/* global _ */
var uuid = require('node-uuid')
var cryptoTools = require('../../lib/crypto-tools')

var FriendKeys = Backbone.Model.extend({
	sync: function(){},
	initialize: function(){
		if(!this.get('id')){
			this.set('id', uuid.v4())
		}

		this.key = forge.pki.publicKeyFromPem(this.get('key'))
	}
})

var KeyRing = Backbone.Collection.extend({
	initialize: function(){
		this.load()
	},
	persist: function(){
		var data = JSON.stringify(this.toJSON())

		localStorage.setItem('keyring', data)
	},
	load: function(){
		var self = this
		var friendsKeys = JSON.parse(localStorage.getItem('keyring'))

		if( _.isEmpty(friendsKeys) ){return;}

		this.add(friendsKeys)
	},
	_createMessage: function(message, keyNames){
		var keys = []

		this.forEach(function(item){
			if(keyNames.indexOf(item.get('name')) >= 0){
				keys.push(item.key)
			}
		})

		message.uuid = uuid.v4()
		message.sender = keys.getSender()
		var msg = cryptoTools.createMessage(message, keys)

		console.log(msg)
		return msg
	},
	sendMessage: function(message, keyNames){
		var msg = this._createMessage(message, keyNames)

		var xhr = $.post('/messages', msg)

		xhr.done(function(data){
			console.log('Success', data)
		})

		xhr.fail(function(data){
			console.log('Success', data)
		})

		return xhr
	},
	model: FriendKeys
})

KeyRing.FriendsKey = FriendKeys

module.exports = KeyRing