'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    del = require('del'),
    runSequence = require('run-sequence'),
    bowerFiles = require('main-bower-files'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    ftp = require('vinyl-ftp'),
    pkg = require('./package.json');


// Config paths to project folders
var basePaths = {
    src: './src/',
    dest: './dist/'
};


// Paths to asset folders
var paths = {
    src: basePaths.src,
    dest: basePaths.dest,

    styles: {
        src: basePaths.src + 'styles/',
        dest: basePaths.dest + 'styles/'
    },
    scripts: {
        src: basePaths.src + 'scripts/',
        dest: basePaths.dest + 'scripts/'
    },
    images: {
        src: basePaths.src + 'images/',
        dest: basePaths.dest + 'images/'
    },
    fonts: {
        src: basePaths.src + 'fonts/',
        dest: basePaths.dest + 'fonts/'
    },
    assets: {
        src: basePaths.src + 'assets/',
        dest: basePaths.dest + 'assets/'
    }
};


// Browser support config
var browserSupport = [
    'last 3 version',
    '> 1%',
    'ie >= 9'
];


// Set name of your iconfont
var fontName = 'Icons';


// Banner to add to file headers
var banner = ['/*',
 ' * <%= pkg.name %> - <%= pkg.version %>',
 ' * <%= pkg.homepage %>',
 ' * <%= pkg.license %> License',
 ' */',
 ''].join('\n');


// Handle Errors
function errorHandler(error) {
    console.log(error.toString());
    this.emit('end');
}


// Lint JavaScript
gulp.task('lint:js', function () {
    return gulp.src(paths.scripts.src + 'scripts.js')
        .pipe(reload({
            stream: true,
            once: true
        }))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Inject JavaScripts from scripts and bower_components-folders
gulp.task('inject:js', function () {
    gulp.src(paths.src + '**/*.html')
        .pipe($.inject(gulp.src(bowerFiles(), {
            read: false
        }), {
            name: 'bower',
            relative: true
        }))
        .pipe($.inject(gulp.src(paths.scripts.src + '**/*.js', {
            read: false
        }), {
            relative: true
        }))
        .pipe(gulp.dest(paths.src));
});

// Compile and Automatically Prefix Stylesheets
gulp.task('compile:styles', function () {
    // For best performance, don't add Less partials to `gulp.src`
    return gulp.src([paths.styles.src + 'style.less'])
        .pipe($.less({
            compress: false
        }))
        .on('error', errorHandler)
        .pipe($.autoprefixer({
            browsers: browserSupport
        }))
        .pipe($.header(banner, {
            pkg: pkg
        }))
        .pipe(gulp.dest('./.tmp/styles/'))
        .pipe(reload({
            stream: true
        }))
        .pipe($.size({
            gzip: false,
            title: 'Styles Unminified'
        }));
});


// Compile and Automatically Prefix Stylesheets
gulp.task('build:styles', function () {
    // For best performance, don't add Less partials to `gulp.src`
    return gulp.src([paths.styles.src + 'style.less'])
        .pipe($.less({
            compress: false
        }))
        .on('error', errorHandler)
        .pipe($.autoprefixer({
            browsers: browserSupport
        }))
        .pipe($.header(banner, {
            pkg: pkg
        }))
        .pipe($.csso())
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe($.size({
            gzip: false,
            title: 'Styles Minified'
        }))
        .pipe($.size({
            gzip: true,
            title: 'Styles Minified'
        }));
});


// Iconfont
gulp.task('iconfont', function () {
    return gulp.src([paths.images.src + 'icons/*.svg'])
        .pipe($.imagemin())
        .pipe($.iconfont({
            fontName: fontName,
            // normalize: true, // use for svg:s from different sources
            //fontHeight: 576, // icon min height must be more than 500px
            centerHorizontally: true,
            descent: (14 * 6) //pixelgrid x baseline shift
        }))
        .on('codepoints', function (codepoints) {
            var options = {
                glyphs: codepoints,
                fontName: fontName,
                fontPath: '../fonts/',
                className: 'icon'
            };
            // build less-file for development
            gulp.src('./templates/_iconfont/icons.less')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({
                    basename: 'icons'
                }))
                .pipe(gulp.dest(paths.styles.src));
            // build html-file for documentation
            gulp.src('./templates/_iconfont/icons.html')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({
                    basename: 'index'
                }))
                .pipe(gulp.dest(paths.src + 'styleguide/'));
        })
        .pipe(gulp.dest(paths.fonts.src))
        .pipe($.size({
            title: 'Iconfonts'
        }));
});


// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function () {
    var assets = $.useref.assets({
        searchPath: ['./.tmp', paths.src, '.']
    });

    return gulp.src([paths.src + '**/*.html'])
        .pipe(assets)
        // Concatenate And Minify JavaScript
        .pipe($.if('*.js', $.uglify({})))
        // Concatenate And Minify Styles
        // In case you are still using useref build blocks
        .pipe($.if('*.css', $.csso()))
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.replace('/style.css', '/style.min.css'))
        .pipe($.if('*.html', $.minifyHtml({conditionals: true})))
        .pipe(gulp.dest(paths.dest))
        .pipe($.size({
            gzip: false,
            showFiles: false,
            title: 'Html'
        }));
});


// Optimize Images
gulp.task('optimize:images', function () {
    return gulp.src(paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}')
        .pipe($.imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(paths.images.dest))
        .pipe($.size({
            showFiles: false,
            title: 'Images'
        }));
});


// Copy all files at root level of src-folder to Output-folder
gulp.task('copy', function () {
    return gulp.src([
    paths.src + '.*',
    !paths.src + '*.html',
    'node_modules/apache-server-configs/' + paths.dest + '.htaccess'], {
            dot: true
        })
        .pipe(gulp.dest(paths.dest))
        .pipe($.size({
            title: 'Copy'
        }));
});


// Copy Web Fonts To Output-folder
gulp.task('copy:fonts', function () {
    return gulp.src([paths.fonts.src + '*'])
        .pipe(gulp.dest(paths.fonts.dest))
        .pipe($.size({
            title: 'Fonts'
        }));
});

// Copy Other design assets Output-folder
gulp.task('copy:assets', function () {
    return gulp.src([paths.assets.src + '**/*'])
        .pipe(gulp.dest(paths.assets.dest))
        .pipe($.size({
            title: 'Assets'
        }));
});


// Clean Output Directory
gulp.task('clean', del.bind(null, ['./.tmp', paths.dest + '**/*', !paths.dest + '/.git'], {
    dot: true
}));


// Watch Files For Changes & Reload
gulp.task('serve', ['compile:styles', 'inject:js'], function () {
    browserSync({
        notify: false,
        logPrefix: 'RAE',
        // https: true,
        server: {
            baseDir: ['./.tmp/', paths.src],
            routes: {
                '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch(paths.src + '**/*.html', reload);
    gulp.watch(paths.styles.src + '**/*.less', ['compile:styles']);
    gulp.watch(paths.scripts.src + '*.js', ['lint:js']);
    gulp.watch('bower.json', ['inject:js']);
    gulp.watch(paths.images + '**/*.{gif,jpg,jpeg,png,svg}', reload);
    gulp.watch(paths.fonts + 'icons/**/*.svg', ['iconfont']);
});


// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function () {
    browserSync({
        notify: false,
        logPrefix: 'RAE',
        // https: true,
        server: {
            baseDir: [paths.dest]
        }
    });
});


// Build production files, the default task
gulp.task('default', ['clean'], function (cb) {
    runSequence(['build:styles', 'lint:js'], ['inject:js'], ['html', 'optimize:images', 'copy:fonts', 'copy:assets', 'copy'], cb);
});




gulp.task('deploy', ['default'], function () {
    var config = require('./ftp-config.json');
    var conn = ftp.create(config.server);
    var globs = [paths.dest + '**'];

    return gulp.src(globs, {
            base: paths.dest,
            buffer: false
        })
        .pipe(conn.differentSize(config.server.remotePath))
        .pipe(conn.dest(config.server.remotePath));
});
