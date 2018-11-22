//initialize all of our variables
var app, base, concat, directory, gulp, gutil, hostname, path, refresh, sass, uglify, imagemin, minifyCSS, del, browserSync, autoprefixer, gulpSequence, shell, sourceMaps, plumber;

var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

//load all of our dependencies
//add more here if you want to include more libraries
gulp        = require('gulp');
gutil       = require('gulp-util');
concat      = require('gulp-concat');
uglify      = require('gulp-uglify');
sass        = require('gulp-sass');
sassGlob    = require("gulp-sass-glob"),
sourceMaps  = require('gulp-sourcemaps');
imagemin    = require('gulp-imagemin');
minifyCSS   = require('gulp-minify-css');
notify      = require('gulp-notify');
browserify = require('browserify'),
wait        = require('gulp-wait');
browserSync = require('browser-sync');
autoprefixer = require('gulp-autoprefixer');
gulpSequence = require('gulp-sequence').use(gulp);
shell       = require('gulp-shell');
plumber     = require('gulp-plumber');

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: "./src/"
        },
    });
});

gulp.task('html', function() {
    //watch any and all HTML files and refresh when something changes
    return gulp.src('*.html')
        .pipe(plumber())
        .pipe(browserSync.reload({stream: true}));s
});

//compressing images & handle SVG files
gulp.task('images', function(tmp) {
    gulp.src(['src/images/*.jpg', 'src/images/*.png', 'src/images/**/*.jpg', 'src/images/**/*.png'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
        .pipe(gulp.dest('src/images'));
});

//compiling our SCSS files
gulp.task('styles', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('src/scss/common.scss')
                .pipe(wait(200))
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber({
                  errorHandler: notify.onError("Error: <%= error.message %>;")
                }))
                //get sourceMaps ready
                .pipe(sourceMaps.init())
                .pipe(sassGlob())
                //include SCSS and list every "include" folder
                .pipe(sass({
                      errLogToConsole: true,
                      includePaths: [
                          'src/scss/'
                      ]
                }))
                .pipe(autoprefixer({
                   browsers: autoPrefixBrowserList,
                   cascade:  true
                }))
                //catch errors
                .on('error', gutil.log)
                //the final filename of our combined css file
                .pipe(concat('style.css'))
                //get our sources via sourceMaps
                .pipe(sourceMaps.write())
                //where to save our final, compressed css file
                .pipe(gulp.dest('src/css'))
                .pipe(browserSync.reload({stream: true, once: true}));
});


var browserify = require('browserify'),
    gulp       = require('gulp'),
    source     = require('vinyl-source-stream'),
    buffer     = require('vinyl-buffer'),
    uglify     = require('gulp-uglify');

gulp.task('scripts', function () {
    return browserify([__dirname + '/src/js/main.js']).bundle()
        .pipe(source('src/js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('src/js'));
});

//this is our master task when you run `gulp` in CLI / Terminal
//this is the main watcher to use when in active development
//  this will:
//  startup the web server,
//  start up browserSync
//  compress all scripts and SCSS files
gulp.task('default', ['browserSync','styles','scripts'], function() {
    //a list of watchers, so it will watch all of the following files waiting for changes
    gulp.watch('src/scss/**', ['styles']);
    gulp.watch('src/js/**', ['scripts']);
    gulp.watch('images/**', ['images']);
});
