'use strict';

const gulp        	= require('gulp'),
			del 					= require('del'),
			gulpSequence 	= require('gulp-sequence'),
			handlebars  	= require('gulp-compile-handlebars'),
			rename      	= require('gulp-rename'),
			browserSync		= require('browser-sync').create(),
			sass					= require('gulp-sass'),
			uglify 				= require('gulp-uglify'),
			pump					= require('pump'),
			autoprefixer	= require('gulp-autoprefixer'),
			replace 			= require('gulp-replace'),
			args					= require('yargs').argv;

// Options

var opts = {
		dir: args.dir,
	},
	baseDir = './src/' + opts.dir;

/* Tasks */

// Serve

gulp.task('serve', function(){
	browserSync.init({
		server: baseDir
	});

	gulp.watch(baseDir + '/css/*.scss', ['sass']);
	gulp.watch(baseDir + '/index.handlebars', ['handlebars']);
	gulp.watch(baseDir + '/js/app.js').on('change', browserSync.reload);
	gulp.watch(baseDir + '/index.html').on('change', browserSync.reload);
});

// Handlebars

var dummy = require('./dummy.json');

gulp.task('handlebars', function(){
	gulp.src(baseDir + '/index.handlebars')
		.pipe(handlebars(dummy[0]))
		.pipe(rename('index.html'))
		.pipe(gulp.dest(baseDir));
});

// CSS

var autoprefixerOpts = {
	browsers: ['last 2 versions', '> 0.5%']
};

gulp.task('sass', function(){
	return gulp.src(baseDir + '/css/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer(autoprefixerOpts))
		.pipe(gulp.dest(baseDir + '/css/'))
		.pipe(browserSync.stream());
});

// JS

gulp.task('compress', function(){
	return gulp.src(baseDir + '/js/app.js')
		.pipe(uglify())
		.pipe(rename('app.min.js'))
		.pipe(gulp.dest(baseDir + '/js/'))
		.pipe(browserSync.stream());
});

// Media

var imageminOpts = {
	optimizationLevel: 3
};

gulp.task('imagemin', function(){
	gulp.src(baseDir + '/media/**')
		.pipe(imagemin(imageminOpts))
		.pipe(gulp.dest());
});

// Clean

gulp.task('clean', function(){
	return del('dist/*', {
			force: true
		}
	);
});

// Build for dist

const data 		= require('./data.json'),
			sizes 	= ['test'];

gulp.task('compile', function(){

	for (let i = 0; i < data.length; i++) {
		const ad = data[i];

		for (let j = 0; j < sizes.length; j++) {
			const dir 			= sizes[j],
						inputDir 	= './src/' + dir,
						outputDir = 'dist/' + ad.id + '/' + dir;

			// compile handlebars
			gulp.src(inputDir + '/index.handlebars')
				.pipe(handlebars(ad))
				.pipe(rename('index.html'))
				.pipe(replace('js/app.js', 'app.min.js'))
				.pipe(replace('css/style.css', 'style.min.css'))
				.pipe(gulp.dest(outputDir));

			// compress media
			gulp.src([
				inputDir + '/images/*'
			])
			.pipe(gulp.dest(outputDir + '/media'));

			let sassOpts = {
				outputStyle: 'compressed'
			};

			// scss
			gulp.src(inputDir + '/css/*.scss')
				.pipe(sass(sassOpts).on('error', sass.logError))
				.pipe(autoprefixer(autoprefixerOpts))
				.pipe(rename('style.min.css'))
				.pipe(gulp.dest(outputDir));

			// js
			gulp.src(inputDir + '/js/app.js')
				.pipe(uglify())
				.pipe(rename('app.min.js'))
				.pipe(gulp.dest(outputDir));
		}
	}
});

gulp.task('dist', gulpSequence('clean', 'compile'));