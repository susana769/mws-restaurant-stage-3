let gulp = require('gulp');
let sass = require('gulp-sass');


gulp.task('styles', function() {
  	gulp.src('sass/**/*.scss')
  		.pipe(sass().on('error', sass.logError))
  		.pipe(gulp.dest('./css'));
  });

/*
gulp.task('default', defaultTask);

function defaultTask(done) {
  // place code for your default task here
  
}*/