var gulp = require('gulp');
var coffee = require('gulp-coffee');

gulp.task('default', function() {
  gulp.src('./src/scripts/*.coffee')
    .pipe(coffee({bare: true}))
    .pipe(gulp.dest('./dist/'));
});
