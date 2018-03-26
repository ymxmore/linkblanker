/*
 * gulpfile.js
 */
const $ = require('gulp-load-plugins')();
const gulp = require('gulp');
const notifier = require('node-notifier');
const pngquant = require('imagemin-pngquant');
const runsequence = require('run-sequence');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');
const webpackStream = require('webpack-stream');
const inproduction = ('production' === process.env.NODE_ENV);
const pkg = require('./package.json');

const header = `/*!
${pkg.name} - ${pkg.description}
@version v${pkg.version}
@link ${pkg.homepage}
@license ${pkg.license}
*/
`;

gulp.task('archive', (callback) => {
  if (!inproduction) {
    $.util.log('Archive should be in the production environment');
  }

  runsequence(
    ['zip'],
    () => {
      notifier.notify({title: 'Task done', message: 'Archive done.'}, callback);
    }
  );
});

gulp.task('build', (callback) => {
  runsequence(
    ['clean', 'htmlhint'],
    ['copyvendor', 'manifest', 'locale', 'optimizeimage', 'styles', 'scripts', 'htmlmin'],
    () => {
      notifier.notify({title: 'Task done', message: 'Build done.'}, callback);
    }
  );
});

gulp.task('clean', () => {
  return gulp.src(['./dist', '.tmp'], {read: false})
    .pipe($.rimraf());
});

gulp.task('copyvendor', function() {
  return gulp.src('./src/vendor/**/*')
    .pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
    .pipe(gulp.dest('./dist/vendor'));
});

gulp.task('htmlhint', function() {
  return gulp.src('./src/html/**/*.html')
    .pipe($.htmlhint())
    .pipe($.htmlhint.reporter());
});

gulp.task('htmlmin', () => {
  return gulp.src(['./src/html/**/*.html'])
    .pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
    .pipe($.htmlmin({
      removeComments: inproduction,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true,
      collapseWhitespace: true,
      preserveLineBreaks: !inproduction,
      useShortDoctype: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
    }))
    .pipe(gulp.dest('./dist/html'));
});

gulp.task('locale', () => {
  return gulp.src('./src/_locales/**/*')
    .pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
    .pipe($.jsonmin())
    .pipe(gulp.dest('./dist/_locales'));
});

gulp.task('manifest', () => {
  return gulp.src('./src/manifest.json')
    .pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
    .pipe($.jsonmin())
    .pipe(gulp.dest('./dist'));
});

gulp.task('optimizeimage', () => {
  return gulp.src(['./src/img/**/*'])
    .pipe($.imagemin({
      use: [pngquant({
        quality: '80-95',
        speed: 1,
      })],
    }))
    .pipe(gulp.dest('./dist/img'));
});

gulp.task('scripts', () => {
  return gulp.src('src/js/apps/*.js')
    .pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest('./dist'));
});

gulp.task('styles', () => {
  return gulp.src('./src/sass/**/*.scss')
    .pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
    .pipe($.if(!inproduction, $.sourcemaps.init()))
    .pipe($.sass({
      includePaths: ['node_modules'],
    }))
    .pipe($.header(header))
    .pipe($.csso())
    .pipe($.if(!inproduction, $.sourcemaps.write('./')))
    .pipe($.rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('zip', ['build'], () => {
  const manifest = require('./src/manifest');
  const filename = (manifest.name + '-v' + manifest.version + '.zip')
    .replace(/\s/, '-')
    .toLowerCase();

  return gulp.src('./dist/**')
    .pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
    .pipe($.zip(filename))
    .pipe(gulp.dest('./archive'));
});

gulp.task('watch', ['build'], () => {
  gulp.watch('./src/manifest.json', () => {
    runsequence('manifest', () => {
      notifier.notify({title: 'Task done', message: 'manifest done.'});
    });
  });

  gulp.watch('./src/_locales/**/*', () => {
    runsequence('locale', () => {
      notifier.notify({title: 'Task done', message: 'locale done.'});
    });
  });

  gulp.watch('./src/html/**/*', () => {
    runsequence('htmlhint', 'htmlmin', () => {
      notifier.notify({title: 'Task done', message: 'build done.'});
    });
  });

  gulp.watch('./src/img/**/*', () => {
    runsequence('optimizeimage', () => {
      notifier.notify({title: 'Task done', message: 'optimize image done.'});
    });
  });

  gulp.watch('./src/js/**/*', () => {
    runsequence('scripts', () => {
      notifier.notify({title: 'Task done', message: 'scripts done.'});
    });
  });

  gulp.watch('./src/sass/**/*', () => {
    runsequence('styles', () => {
      notifier.notify({title: 'Task done', message: 'styles done.'});
    });
  });
});

gulp.task('default', ['watch']);
