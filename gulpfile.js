var gulp = require('gulp'),
    sass = require('gulp-sass'),
    sassGlob = require("gulp-sass-glob"),
    cssImport = require('postcss-import'),
    autoprefixer = require('autoprefixer'),
    frontnote = require('gulp-frontnote'),
    uglify = require('gulp-uglify'),
    browserify = require('browserify'),
    babelify = require('babelify');
    source = require('vinyl-source-stream');
    buffer = require('vinyl-buffer');
    watchify = require('watchify');
    rimraf = require('rimraf'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync'),
    ssi = require('browsersync-ssi'),
    plumber = require("gulp-plumber"),
    htmlv = require('gulp-htmlhint'),
    notify = require('gulp-notify'),
    postcss = require('gulp-postcss'),
    csssort = require('css-declaration-sorter'),
    mqpacker = require("css-mqpacker"),
    cssnano = require("cssnano"),
    sourcemaps = require('gulp-sourcemaps'),
    syntax_scss = require('postcss-scss'),
    stylelint = require('stylelint');
    reporter = require('postcss-reporter'),
    changed  = require('gulp-changed'),
    imagemin = require('gulp-imagemin'),
    imageminPngquant = require('imagemin-pngquant'),
    cache = require('gulp-cached'),
    rename = require('gulp-rename'),
    cleanCSS = require('gulp-clean-css');

/* developディレクトリ */
var src = {
  'root': 'src/',
  'html': 'src/.html',
  'css': ['src/scss/*.scss', 'src/scss/**/*.scss'],
  // 'js': ['src/js/**/*.js', '!js/min/**/*.js'],
  'js': 'src/js/script.js',
  'image': 'src/images/**/*.+(jpg|jpeg|png|gif|svg|ico)',
  'imageWatch': 'src/images/**/*',
  'public': 'public/**/*'
};

/* tmpディレクトリ */
var tmp = {
  'root': 'tmp/',
  'image': 'tmp/images/',
  'css': 'tmp/css/',
  'js': 'tmp/js/'
};

/* publicディレクトリ */
var public = {
  'root': 'public/',
  'html': 'public/*.html',
  'image': 'public/images/',
  'css': 'public/css/',
  'js': 'public/js/'
};


gulp.task('default', ['clean:tmp'], function() {
  runSequence(
    'watch',
    'server'
  )
});


gulp.task('server', function(){
  browserSync.init({
    server: {
      baseDir: tmp.root,
      middleware:[
        ssi({
          ext: '.html',
          baseDir: tmp.root
        })
      ]
    }
  });
});
/**
 * /public/以下のHTMLファイルを監視、更新があれば反映します。
 */
gulp.task('html', function() {
  return gulp.src(public.html)
  .pipe(browserSync.reload({stream: true}));
});

// htmllint
gulp.task('check-html', function(){
  return gulp.src('src/*.html')
    .pipe(plumber({
      errorHandler: notify.onError("Error: <%= error.message %>;")
    }))
    .pipe(cache('html'))
    .pipe(htmlv())
    .pipe(htmlv.reporter())
    .pipe(gulp.dest(tmp.root))
    .pipe(gulp.dest(public.root));
});

gulp.task('sass', function(){
  return gulp.src(src.css)
    .pipe(plumber({
      errorHandler: notify.onError("Error: <%= error.message %>;")
    }))
    .pipe(sourcemaps.init())
    .pipe(frontnote({
      out: './_styleguide',
      css: '../tmp/css/common.css'
    }))
    .pipe(sassGlob())
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 2 version'],
        grid: true
      }),
      csssort({
        order: 'smacss'
      }),
      cssImport({path: ['node_modules']}),
      mqpacker()
      // cssnano({ autoprefixer: false })
    ]))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(tmp.css))
    .pipe(browserSync.reload({stream: true, once: true}))
});

// css圧縮
gulp.task('css', ['sass'], function(){
  return gulp.src('tmp/css/common.css')
    .pipe(plumber({
      errorHandler: notify.onError("Error: <%= error.message %>;")
    }))
    .pipe(postcss([
      cssnano({ autoprefixer: false })
    ]))
    .pipe(gulp.dest(public.css))
});

/* ES2015以降のコードをES5に変換（トランスコンパイル）します。 */
function bundle(watching = false) {
  const b = browserify({
    entries: src.js,
    transform: ['babelify'],
    debug: true,
    plugin: (watching) ? [watchify] : null
  })
  .on('update', function() {
    bundler();
    console.log('scripts rebuild');
  });

  function bundler() {
    return b.bundle()
      .on('error', function(err) {
        console.log(err.message);
      })
      .pipe(source('script.js'))
      .pipe(gulp.dest(tmp.js))
      // 生のデータをストリームにし、vinylのオブジェクト/ファイルに変換
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify({output: {comments: /^!/}}))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(public.js))
      .pipe(browserSync.reload({stream: true, once: true}))
  }
  return bundler();
}

/**
 * 出力用のディレクトリを削除します。
 */
gulp.task('clean:tmp', function (cb) {
  return rimraf(tmp.root, cb);
});

gulp.task('build', function(callback) {
  runSequence(
    ['html', 'check-html', 'css', 'imagemin', 'js'], callback
  )
});

gulp.task('js', function() {
  bundle();
});

// js圧縮
// gulp.task('js', function(){
//   pump([
//       plumber({
//         errorHandler:notify.onError('Error: <%= error.message %>')
//       }),
//       gulp.src(src.js),
//       gulp.dest(tmp.js),
//       uglify(),
//       gulp.dest(public.js)
//     ]
//   );
//   return gulp.src('public/js/**/*.js')
//     .pipe(browserSync.reload({stream: true, once: true}))
// });

gulp.task('imagemin', function(){
  var imageminOptions = {
        optimizationLevel: 7,
        progressive: true,
        interlaced: true,
        use:imageminPngquant({quality: '65-80',speed: 1})
      };

  return gulp.src(src.image)
    .pipe(changed(tmp.image))
    .pipe(plumber({
      errorHandler:notify.onError('Error: <%= error.message %>')
    }))
    .pipe(imagemin(imageminOptions))
    .pipe(gulp.dest(tmp.image))
    .pipe(gulp.dest(public.image))
    .pipe(browserSync.reload({stream: true, once: true}));
});

gulp.task('watch', ['build'], function(){
  gulp.watch(src.html,['check-html']);
  gulp.watch(public.html,['html']);
  gulp.watch(src.js,['js']);
  gulp.watch(src.css,['css']);
  gulp.watch(src.image, ['imagemin']);
  // gulp.watch(src.public, ['public']);
});
