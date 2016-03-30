var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var env = require('gulp-env');

var livereload = require('gulp-livereload')
var webpack = require('webpack')

var webpackConfig = {
	entry: {
		main: './build/main.jsx',
	},
	output: {
		filename: './public/build/[name].js',
		sourceMapFilename: '[file].map'
	},
	devtool: ['source-map'],
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				query:{
					"presets": ["react"]
				}
			}
		]
	},
	externals:{
		'node-forge': 'forge',
		'jquery': 'jquery'
	}
}

gulp.task('webpack', function (callback) {
	webpack(webpackConfig, function (err, stats) {
		if (err) { throw new gutil.PluginError('webpack', err) }
		var statsAsString = stats.toString({})

		gutil.log('[webpack]', statsAsString )
		livereload.changed('public/js/main.js')
		callback()
	})
})

gulp.task('mocha', function() {
	var envs = env.set({
		NODE_ENV: 'test',
		PORT: 3500
	});

	return gulp.src(['test/*.js'], { read: false })
		.pipe(mocha({ reporter: 'list' }))
		.on('error', gutil.log);
});

gulp.task('watch-mocha', function() {
	gulp.watch(['server.js', 'test/**', 'lib/**'], ['mocha']);
});

gulp.task('watch-webpack', function () {
	livereload.listen()
	gulp.watch([
		'build/**',
		'lib/**'
	], ['webpack'])
})