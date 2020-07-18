var gulp = require('gulp');
var concat = require('gulp-concat');
var ts = require('gulp-typescript');
var replace = require('gulp-replace');
var merge = require('merge-stream');
var clean = require('gulp-clean');
var fs = require('fs');
var sourcemap = require('gulp-sourcemaps');

gulp.task('compile', () => {
   return gulp.src('./src/ts/class/*.ts')
      // join all into one file
      .pipe(concat('compiled.ts'))
      // remove import statements
      .pipe(replace(/import[^\n]*/g, ''))
      // remove default keywords
      .pipe(replace(/ default*/g, ''))
      // remove comments
      .pipe(replace(/\/\/[^\n]*/gm, ''))
      // remove empty lines
      .pipe(replace(/^\s*[\r\n]/gm, ''))
      .pipe(gulp.dest('release/'))
      .pipe(ts({
         target: 'es2020',
         declaration: true
      }))
      .pipe(gulp.dest('release/'))
})

gulp.task('clean', ()=>{
   return gulp.src('./public')
   .pipe(clean())
})

gulp.task('build', ()=>{

   let v = Number(fs.readFileSync('./src/version',{encoding: 'UTF-8'}));
   v++;
   fs.writeFileSync('./src/version',v);

   var mainTs = gulp.src('./src/ts/**/*.ts')
   .pipe(sourcemap.init())
   .pipe(ts({target:'es2020'}))
   .pipe(sourcemap.write())
   .pipe(gulp.dest('./public/js'))

   var htmlFiles = gulp.src(['./src/*.html','./src/*.css','./src/manifest.json'])
   .pipe(gulp.dest('./public/'))

   var images = gulp.src(['./src/img/**/*','./assets/**/*.png'])
   .pipe(gulp.dest('./public/img'))

   var sw = gulp.src('./src/serviceWorker.ts')
   .pipe(replace('##VERSION##',`${v}`))
   .pipe(ts({target:'es2020'}))
   .pipe(gulp.dest('./public'))

   var lib = gulp.src('./src/lib/*.js')
   .pipe(gulp.dest('./public/lib'));

   var version = gulp.src('./src/version')
   .pipe(gulp.dest('./public/'));

   var allStreams = merge(mainTs, htmlFiles);
   allStreams.add(images)
   allStreams.add(sw)
   allStreams.add(lib)
   allStreams.add(version)

   return allStreams;
})