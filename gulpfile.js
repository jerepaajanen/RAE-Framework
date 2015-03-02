'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    del = require('del'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
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

// Browser autoprefix config
var autoprefix = [
    '> 1%',
    'last 2 version',
    'ie >= 9'
];

// Set name of your icon-font
var fontName = 'Icons';

// Banner to add to file headers
var banner = ['/*',
 ' * <%= pkg.name %> - <%= pkg.version %>',
 ' * Copyright © 2014 Rae',
 ' * http://www.rae.fi',
 ' */',
 ''].join('\n');


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

// Compile and Automatically Prefix Stylesheets
gulp.task('compile:styles', function () {
    // For best performance, don't add Less partials to `gulp.src`
    return gulp.src([paths.styles.src + 'style.less'])
        .pipe($.less({
            compress: false
        }))
        .on('error', errorHandler)
        .pipe($.autoprefixer({
            browsers: autoprefix
        }))
        .pipe(gulp.dest('./.tmp/styles/'))
            .pipe(reload({
            stream: true
        }))
        .pipe($.size({
            title: 'Styles'
        }));
});

// Compile and Automatically Prefix Stylesheets
gulp.task('build:styles', function () {
    return gulp.src([paths.styles.src + 'style.less'])
        .pipe($.less({
            compress: false
        }))
        .on('error', errorHandler)
        .pipe($.autoprefixer({
            browsers: autoprefix
        }))
        .pipe(gulp.dest('./.tmp/styles/'))
        .pipe($.csso())
        .pipe($.header(banner, {
            pkg: pkg
        }))
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe($.size({
            title: 'Styles'
        }));
});

// Iconfont
gulp.task('iconfont', function () {
    return gulp.src([paths.images.src + 'icons/*.svg'])
        .pipe($.imagemin())
        .pipe($.iconfont({
            fontName: fontName,
            // normalize: true, // use for svg:s from different sources
            //fontHeight: 576,
            descent: (14 * 6) //pixelgrid x baseline shift
        }))
        .on('codepoints', function(codepoints) {
            var options = {
                glyphs: codepoints,
                fontName: fontName,
                fontPath: '../fonts/',
                className: 'icon',
                fontSize: 14
            };
            // build less-file for development
            gulp.src('./templates/_iconfont/icons.less')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({ basename:'icons' }))
                .pipe(gulp.dest(paths.styles.src));
            // build html-file for documentation
            gulp.src('./templates/_iconfont/icons.html')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({ basename:'icons' }))
                .pipe(gulp.dest(paths.src + 'styleguide/'));
        })
        .pipe(gulp.dest(paths.fonts.src))
        .pipe($.size({
            title: 'Icon-fonts'
        }));
});


// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function () {
    var assets = $.useref.assets({
        searchPath: ['./.tmp', paths.src]
    });
    return gulp.src(paths.src + '**/*.html')
        .pipe(assets)
        // Concatenate And Minify JavaScript
        .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
        // Concatenate And Minify Styles
        // In case you are still using useref build blocks
        .pipe($.if('*.css', $.csso()))
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.replace('/style.css', '/style.min.css'))
        .pipe($.if('*.html', $.minifyHtml()))
        .pipe(gulp.dest(paths.dest))
        .pipe($.size({
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
gulp.task('serve', ['compile:styles'], function () {
    browserSync({
        notify: false,
        logPrefix: 'RAE',
        // https: true,
        //files: paths.src + "**/*.html",
        server: {
            baseDir: ['./.tmp/', paths.src]
        }
    });
    
    gulp.watch(paths.src + '**/*.html', reload);
    gulp.watch(paths.styles.src + '**/*.less', ['compile:styles']);
    gulp.watch(paths.scripts.src + '*.js', ['lint:js']);
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
    runSequence('build:styles', ['lint:js', 'html', 'optimize:images', 'copy:fonts', 'copy:assets', 'copy'], cb);
});

// Deploy production files, to the remote server
gulp.task('deploy', ['default'], function () {
    var ftpConfig = require('./ftp-config.json');

    return gulp.src(paths.dest + '**/*')
        .pipe($.size({
            title: 'Deploy'
        }))
        .pipe($.ftp(ftpConfig.server));
});



// Handle Errors
function errorHandler(error) {
    console.log(error.toString());
    this.emit('end');
}