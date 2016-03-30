var Koa = require('koa')
var co = require('co')
var convert = require('koa-convert')
var serve = require('koa-static')
var bodyParser = require('koa-bodyparser')
var path = require('path')
var http = require('http')
var mongoose = require('mongoose');

// Mongoose connect and models
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/otr');

var MessageSchema = new Schema({
	fingerprint: {type: String, required: true},
	messageKey: {type: String, required: true},
	content: {type: String, required: true},
	createdAt: { type: Date, expires: '24h', default: Date.now }
})

var Messages = mongoose.model('Message', MessageSchema)

// Creates app
var app = new Koa()
var server = http.createServer(app.callback())

server.db = mongoose

// Add render
var render = require('koa-swig')
app.context.render = render({
	root: path.join(__dirname, 'views'),
	locals: {env: process.env.NODE_ENV},
	cache: false, // disable, set to false
	ext: 'html'
})

// Add static files
app.use( convert( serve(__dirname + '/public') ) )

// Add request logger
app.use(co.wrap(function *(ctx, next){
	const start = new Date
	yield next()
	const ms = new Date - start
	console.log(`${ctx.method} ${ctx.status} ${ctx.url} - ${ms}ms`)
}))

// Add erro handler
app.use(co.wrap(function *(ctx, next) {
	try {
		yield next()
	} catch (err) {
		console.log(err)
		ctx.status = err.status || 500
		ctx.body = err.message
	}
}))

// Add body parser
app.use( convert(bodyParser()) )

var router = require('koa-router')()

router.get('/', function *(ctx) {
	// this.body = 'hello world'
	yield this.render('index', {})
})

router.get('/client', function *(ctx) {
	// this.body = 'hello world'
	yield this.render('client', {})
})

router.post('/messages', function *(ctx) {
	var body = this.request.body;

	if(!body.content){
		return this.body = this.throw(422, 'Messages requires content')
	}

	if(!body.recipients || !body.recipients.length){
		return this.body = this.throw(422, 'Messages requires at least one recipient')
	}

	var message = yield Messages.create(body.recipients.map(function(item){
		return {
			fingerprint : item.fingerprint,
			messageKey : item.messageKey,
			content : body.content
		}
	}))

	if(message){
		this.body = {success:true}
	}else{
		this.body = {success:false, error:'Messages couldn\'t create message'}
	}
})

router.get('/messages/:fingerprint', function *(ctx) {
	var messages = yield Messages.find({fingerprint:this.params.fingerprint})

	this.body = messages
})

app.use( convert(router.routes()) )
	.use( convert(router.allowedMethods()) )

module.exports = server