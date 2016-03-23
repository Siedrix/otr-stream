var Koa = require('koa')
var co = require('co')
var convert = require('koa-convert')
var serve = require('koa-static')
var bodyParser = require('koa-bodyparser')
var path = require('path')
var http = require('http')
var IO = require('socket.io')

// Creates app
var app = new Koa()
var server = http.createServer(app.callback())
var io = IO(server)

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

app.use( convert(router.routes()) )
	.use( convert(router.allowedMethods()) )

io.on('connection', function (socket) {
	console.log('socket connected')

	socket.on('join', function(data){
		console.log('socket join to:', data)

		socket.broadcast.emit('user-connected', data)
	})

	socket.on('disconnect', function () {
		console.log('socket disconnect')
	})
})

server.listen(3000, function(){
	console.log('server running')
})