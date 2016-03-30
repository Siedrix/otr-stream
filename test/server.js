// Dependencies
var assert = require('assert')
var request = require('request')
var _ = require('underscore')

// Modules
var server = require('../server')
var baseUrl = 'http://localhost:'+process.env.PORT

describe('Server', function() {
	before('Start server',function(done){
		server.listen(process.env.PORT, done)
	})

	before('Clear messages',function(done){
		var Messages = server.db.model('Message')

		Messages.remove({},done)
	})	

	after(function(done){
		server.close(done)
	})	

	describe('add messages', function(){
		it('should add a message on post to /message', function (done) {
			request.post({
				url: baseUrl+'/messages/',
				json: {
					content: 'foo',
					recipients : [
						{
							fingerprint: '6f:ed:bf:d9:54:ec:9d:a4:0d:ab:49:c3:da:5a:86:ff',
							messageKey: 'Lolz'
						}
					]
				}
			}, function (err, res, body) {
				assert.equal(err, undefined)
				assert.equal(body.success, true)
				done()
			})
		})

		it('should add a message on post to /message', function (done) {
			request.post({
				url: baseUrl+'/messages/',
				json: {
					content: 'foo',
					recipients : [
						{
							fingerprint: '6f:ed:bf:d9:54:ec:9d:a4:0d:ab:49:c3:da:5a:86:ff',
							messageKey: 'Cat'
						},
						{
							fingerprint: '6f:ed:bf:d9:54:ec:9d:a4:0d:ab:49:c3:da:5a:86:f7',
							messageKey: 'Cat'
						},						
					]
				}
			}, function (err, res, body) {
				assert.equal(err, undefined)
				assert.equal(body.success, true)
				done()
			})
		})		

		it('should add messages on post to /message', function (done) {
			request.post({
				url: baseUrl+'/messages/',
				json: {
					recipients : [
						{
							fingerprint: '6f:ed:bf:d9:54:ec:9d:a4:0d:ab:49:c3:da:5a:86:ff',
							messageKey: 'Lolz'
						}
					]
				}
			}, function (err, res, body) {
				assert.equal(res.statusCode, 422)
				assert.equal(body, 'Messages requires content')
				
				done()
			})
		})

		it('should add messages on post to /message', function (done) {
			request.post({
				url: baseUrl+'/messages/',
				json: {
					content: 'foo',
				}
			}, function (err, res, body) {
				assert.equal(res.statusCode, 422)
				assert.equal(body, 'Messages requires at least one recipient')
				
				done()
			})
		})

		it('should have 3 messages in the DB', function(done){
			var Messages = server.db.model('Message')
			Messages.find({}, function(err, messages){
				assert.equal(err, undefined)
				assert.equal(messages.length, 3)
				done()
			})
		})		
	})

	describe('get messages per finger print', function () {
		it('should return the finder print', function (done) {
			request({
				url: baseUrl+'/messages/6f:ed:bf:d9:54:ec:9d:a4:0d:ab:49:c3:da:5a:86:ff',
				json:true
			}, function (err, res, body) {
				assert.equal(err, undefined)
				assert.equal(_.isArray(body), true)
				assert.equal(body.length, 2)

				var firstMessage = body[0]
				var secondMessage = body[1]

				assert.equal(firstMessage.messageKey, 'Lolz')
				assert.equal(secondMessage.messageKey, 'Cat')


				done()
			})
		})
	})

});