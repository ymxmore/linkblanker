/*
 * gulpfile.js
 */

// ------------------------------------------------------------
// Libraries
// ------------------------------------------------------------

var async = require('async');
var browserify = require('browserify');
var browserifyshim = require('browserify-shim');
var buffer = require('vinyl-buffer');
var colors = require('colors');
var compass = require('gulp-compass');
var flatten = require('gulp-flatten');
var glob = require('glob');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var header = require('gulp-header');
var jshint = require('gulp-jshint');
var jsonmin = require('gulp-jsonmin');
var htmlmin = require('gulp-htmlmin');
var htmlhint = require("gulp-htmlhint");
var imagemin = require('gulp-imagemin');
var manifest = require('./src/manifest');
var notifier = require('node-notifier');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var pngquant = require('imagemin-pngquant');
var react = require('gulp-react');
var reactify = require('reactify');
var rename = require('gulp-rename');
var rimraf = require('gulp-rimraf');
var runsequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');


// ------------------------------------------------------------
// Environments
// ------------------------------------------------------------

var inproduction = ('production' === process.env.NODE_ENV);

// ------------------------------------------------------------
// Variables
// ------------------------------------------------------------

var pkg = require('./package.json');
var banner = [
  '/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''
].join("\n");

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
});

var errorHandler = function (title) {
  return function () {
    notify.onError({
      title: title,
      message: '<%= error %>'
    }).apply(this, arguments);

    this.emit('end');
  };
};

// ------------------------------------------------------------
// Tasks
// ------------------------------------------------------------

gulp.task('archive', function (callback) {
  if (!inproduction) {
    console.log('Archive should be in the production environment'.warn);
  }

  runsequence(
    [ 'zip' ],
    function () {
      notifier.notify({title: 'Task done', message: 'Archive done.' }, callback);
    }
  );
});

gulp.task('browserify', function (callback) {
  async.each(glob.sync('./src/js/apps/*'), function (file, cb) {
    browserify({
      insertGlobals: true,
      debug: !inproduction,
      entries: file,
    })
    .bundle()
    .on('error', errorHandler('An error has occurred in browserify'))
    .pipe(source(file))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: !inproduction,
    }))
    .pipe(uglify({
      preserveComments: 'some',
      output: {
        beautify: !inproduction,
        indent_level: 2,
      },
      compress: {
        global_defs: {
          __API_VERSION__: manifest.version,
          __NODE_ENV__: process.env.NODE_ENV || 'development',
          __BUILD_DATE_AT__: new Date().toString(),
        },
      }
    }))
    .pipe(header(banner, { pkg: pkg } ))
    .pipe(rename({
      prefix: 'bundle.',
      suffix: '.min',
      extname: '.js',
    }))
    .pipe(gulpif(!inproduction, sourcemaps.write('./', {
      addComment: !inproduction,
    })))
    .pipe(flatten())
    .pipe(gulp.dest('./dist/js'))
    .on('end', cb);
  }, callback);
});

gulp.task('build', function (callback) {
  runsequence(
    [ 'clean', 'htmlhint', 'jshint' ],
    [ 'manifest', 'locale', 'fontcopy', 'optimazeimage', 'compass', 'browserify', 'htmlmin' ],
    function () {
      notifier.notify({title: 'Task done', message: 'Build done.' }, callback);
    }
  );
});

gulp.task('clean', function () {
  return gulp.src([ './dist/*', '.tmp' ], { read: false })
    .pipe(rimraf());
});

gulp.task('compass', function () {
  return gulp.src('./src/sass/**/*.scss')
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
    .pipe(compass({
      debug: !inproduction,
      css: '.tmp/css',
      sass: 'src/sass',
      style: inproduction ? 'compressed' : 'nested',
      image: 'img',
      font: 'font',
    }))
    .pipe(gulp.dest('.tmp/css'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('fontcopy', function () {
  return gulp.src([
      './src/font/**/*',
      './node_modules/font-awesome/fonts/*'
    ])
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
    .pipe(gulp.dest('./dist/font'));
});

gulp.task('htmlhint', function() {
  return gulp.src('./src/html/**/*.html')
    .pipe(htmlhint())
    .pipe(htmlhint.reporter())
});

gulp.task('htmlmin', function () {
  return gulp.src([ './src/html/**/*.html' ])
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
    .pipe(htmlmin({
      removeComments: inproduction ,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true,
      collapseWhitespace: true,
      preserveLineBreaks: !inproduction,
      useShortDoctype: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('jshint', function () {
  return gulp.src('./src/js/**/*.+(js|jsx)')
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
    .pipe(react())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('locale', function () {
  return gulp.src('./src/_locales/**/*')
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
    .pipe(jsonmin())
    .pipe(gulp.dest('./dist/_locales'));
});

gulp.task('manifest', function () {
  return gulp.src('./src/manifest.json')
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
    .pipe(jsonmin())
    .pipe(gulp.dest('./dist'));
});

gulp.task('optimazeimage', function () {
  return gulp.src([ './src/img/**/*' ])
    .pipe(imagemin({
      use: [ pngquant({
        quality: '80-95',
        speed: 1
      })]
    }))
    .pipe(gulp.dest('./dist/img'));
});

gulp.task('zip', [ 'build' ], function () {
  var filename = (manifest.name + '-v' + manifest.version + '.zip')
    .replace(/\s/, '-')
    .toLowerCase();

  return gulp.src('./dist/**')
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
    .pipe(zip(filename))
    .pipe(gulp.dest('./archive'));
});


gulp.task('watch', [ 'build' ], function () {
  gulp.watch('./src/manifest.json', function () {
    runsequence('manifest', function () {
      notifier.notify({title: 'Task done', message: 'manifest'});
    });
  });

  gulp.watch('./src/_locales/**/*', function () {
    runsequence('locale', function () {
      notifier.notify({title: 'Task done', message: 'locale'});
    });
  });

  gulp.watch('./src/html/**/*', function () {
    runsequence('htmlhint', 'htmlmin', function () {
      notifier.notify({title: 'Task done', message: 'htmlhint, htmlmin'});
    });
  });

  gulp.watch('./src/font/**/*', function () {
    runsequence('fontcopy', function () {
      notifier.notify({title: 'Task done', message: 'fontcopy'});
    });
  });

  gulp.watch('./src/img/**/*', function () {
    runsequence('optimazeimage', function () {
      notifier.notify({title: 'Task done', message: 'optimazeimage'});
    });
  });

  gulp.watch('./src/js/**/*', function (event) {
    runsequence('jshint', 'browserify', function () {
      notifier.notify({title: 'Task done', message: 'jshint, browserify'});
    });
  });

  gulp.watch('./src/sass/**/*', function () {
    runsequence('compass', function () {
      notifier.notify({title: 'Task done', message: 'compass'});
    });
  });
});

gulp.task('default', [ 'watch' ]);
