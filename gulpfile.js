/*jslint node:true*/

'use strict';

// REQUIRES
// -------------------------------------------------------

var
    gulp = require('gulp'),
    fs = require('fs'),
    del = require('del'),
    sequence = require('run-sequence'),
    bowerFiles = require('main-bower-files'),
    browserSync = require('browser-sync'),
    ftp = require('vinyl-ftp'),
    pkg = require('./package.json'),
    config = require('./config.json'),
    $ = require('gulp-load-plugins')(),
    flags = require('minimist')(process.argv.slice(2));


// VARS
// -------------------------------------------------------

var
    isProduction = (flags.production || flags.p) || false,
    isServe = (flags.serve || flags.s) || false,
    isDeploy = (flags.deploy || flags.d) || false;

var
    basePaths = {
        src: config.folders.src,
        dest: config.folders.dest
    },
    paths = {
        src: basePaths.src,
        dest: basePaths.dest,
        // Paths to subfolders
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
    },

    // Banner to add to file headers
    banner = ['/*',
                  ' * <%= pkg.name %> - <%= pkg.version %>',
                  ' * <%= pkg.homepage %>',
                  ' * <%= pkg.license %> License',
                  ' */',
                  ''].join('\n');


// HANDLE ERRORS
// -------------------------------------------------------

function handleErrors(error) {
    console.log($.util.colors.red(error.toString()));
    $.util.beep();
    this.emit('end');
}


// DEFAULT TASKS
// -------------------------------------------------------

gulp.task('default', function () {

    if (isProduction) {
        gulp.start('default:production');
    } else {
        gulp.start('default:development');
    }

});

gulp.task('default:development', function () {
    sequence(['markup', 'styles', 'scripts', 'images'], function () {
        if (isServe) {
            gulp.start(['serve', 'watch']);
        }
        if (isDeploy) {
            gulp.start(['deploy']);
        }
    });
});

gulp.task('default:production', function () {
    sequence(['clean'], ['images'], ['markup', 'styles', 'scripts'], function () {
        console.log($.util.colors.green('✔ Build done!'));
        if (isServe) {
            gulp.start(['serve']);
        }
        if (isDeploy) {
            gulp.start(['deploy']);
        }

    });
});


// MARKUP
// -------------------------------------------------------

var markupTask = function (isNotPartial) {
    gulp.src(paths.src + '**/*.html', {
        base: paths.src
    })
        .pipe(isNotPartial || isProduction ? $.changed(paths.dest) : $.util.noop())
        .pipe($.preprocess({
            context: {
                ENV: flags.production || flags.p === true ? 'production' : 'development',
                UA: config.analyticsUA,
                META: {
                    author: pkg.author,
                    title: config.siteTitle,
                    description: config.siteDescription,
                    url: config.siteURL,
                    image: config.shareImageURL,
                    twitterHandle: config.twitterHandle
                }
            }
        }))
        .pipe($.if(isProduction, $.minifyHtml({
            conditionals: true
        })))
        .pipe(gulp.dest(paths.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
};

// Markup : Main
gulp.task('markup', function () {
    return markupTask(true);
});


// Markup : Partials
gulp.task('markup:partials', function () {
    return markupTask();
});




// SCRIPTS
// -------------------------------------------------------

gulp.task('scripts', ['scripts:main', 'scripts:vendor']);

// Scripts : Vendor
gulp.task('scripts:vendor', function () {
    return gulp.src(bowerFiles(), {
        base: './bower_components'
    })
        .pipe($.if('*.js', $.concat('vendor.js')))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe($.if(isProduction, $.uglify()))
        .on('error', handleErrors)
        .pipe($.if(isProduction, $.rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe($.if(isProduction, $.size({
            gzip: false,
            title: 'Scripts:Vendor'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// Scripts : Hint
gulp.task('scripts:hint', function () {
    return gulp.src(paths.scripts.src + '**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});


// Scripts : Main
gulp.task('scripts:main', ['scripts:hint'], function () {
    return gulp.src(paths.scripts.src + '**/*.js')

        .pipe($.concat('main.js'))
        .pipe($.if(isProduction, $.uglify()))
        .on('error', handleErrors)
        .pipe($.if(isProduction, $.rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe($.if(isProduction, $.size({
            gzip: false,
            title: 'Scripts:main'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// STYLES
// -------------------------------------------------------

gulp.task('styles', function () {
    return gulp.src(paths.styles.src + 'style.less')
        .pipe($.less({
            compress: false
        }))
        .on('error', handleErrors)
        .pipe($.autoprefixer({
            browsers: config.browserSupport
        }))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe($.if(isProduction, $.combineMediaQueries()))
        .pipe($.if(isProduction, $.csso()))
        .pipe($.if(isProduction, $.header(banner, {
            pkg: pkg
        })))
        .pipe($.if(isProduction, $.rename({
            suffix: '.min'
        })))
        .pipe($.if(isProduction, gulp.dest(paths.styles.dest)))
        .pipe($.if(isProduction, $.size({
            gzip: false,
            title: 'Styles'
        })))
        .pipe($.if(isProduction, $.size({
            gzip: true,
            title: 'Styles'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// FONTS
// -------------------------------------------------------

gulp.task('fonts', function () {
    return gulp.src(paths.fonts.src + '**/*.ttf')
        .pipe($.ttf2woff({
            clone: true
        }))
        .pipe($.ttf2woff2({
            clone: true
        }))
        .pipe(gulp.dest(paths.fonts.dest));
});


// Fonts : Icons
gulp.task('fonts:icons', function () {
    return gulp.src(paths.images.src + 'icons/**/*.svg')
        .pipe($.changed(paths.images.dest + 'icons/**/*.svg'))
        .pipe($.iconfont({
            fontName: config.iconfont.fontName,
            autohint: config.iconfont.autohint,
            formats: ['ttf', 'woff', 'woff2'],
            normalize: true,
            fontHeight: (config.iconfont.gridSize * config.iconfont.gridSize * 2),
            centerHorizontally: true,
            descent: ((config.iconfont.gridSize * config.iconfont.gridSize * 2) / config.iconfont.baselineShift)
        }))
        .on('glyphs', function (glyphs) {
            var options = {
                glyphs: glyphs,
                fontName: config.iconfont.fontName,
                fontPath: '../fonts/',
                className: config.iconfont.className
            };

            // Build Less-files
            gulp.src('./templates/_iconfont/icons.less')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({
                    basename: 'icons'
                }))
                .pipe(gulp.dest(paths.styles.src + 'objects'));

            // Build html-file for documentation
            gulp.src('./templates/_iconfont/icons.html')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({
                    basename: 'index'
                }))
                .pipe(gulp.dest(paths.src + 'styleguide/'));
        })
        .pipe(gulp.dest(paths.fonts.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// IMAGES
// -------------------------------------------------------

gulp.task('images', ['images:optimize', 'images:favicons']);


// Images : Optimize
gulp.task('images:optimize', function () {
    return gulp.src(paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}')
        .pipe($.changed(paths.images.dest))
        .pipe($.cache($.imagemin({
            optimizationLevel: 7,
            progressive: true,
            interlaced: true,
            svgoPlugins: [{
                removeViewBox: false
            }]
        })))
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// Images : Favicons
gulp.task('images:favicons', function () {

    fs.writeFileSync(paths.src + 'partials/favicons.html', '');

    return gulp.src(paths.images.src + '/favicon.png')
        .pipe($.if(isProduction, $.favicons({
            appName: config.title,
            appDescription: config.description,
            developerName: pkg.author,
            developerURL: pkg.homepage,
            background: 'transparent',
            url: config.siteURL,
            path: 'images/favicons',
            display: 'standalone',
            orientation: 'portrait',
            version: 1.0,
            logging: false,
            online: false,
            html: '../../' + paths.src + 'partials/favicons.html'
        })))

        .pipe(gulp.dest(paths.dest));

});


// COPY
// -------------------------------------------------------

gulp.task('copy', ['copy:root', 'copy:assets']);

// Copy : Root
gulp.task('copy:root', function () {
    return gulp.src([
        paths.src + '*',
        'node_modules/apache-server-configs/dist/.htaccess',
        '!' + paths.src + '**/*.html',
        '!' + paths.images.src + '**/*',
        '!' + paths.styles.src + '**/*',
        '!' + paths.scripts.src + '**/*',
        '!' + paths.fonts.src + '**/*',
        '!' + paths.assets.src + '**/*'], {
        dot: true
    })
        .pipe(gulp.dest(paths.dest));
});

// Copy : Assets
gulp.task('copy:assets', function () {
    return gulp.src(paths.assets.src + '**/*')
        .pipe(gulp.dest(paths.assets.dest));
});


// CLEAN
// -------------------------------------------------------

gulp.task('clean', function () {
    del([paths.dest + '**/*']);
});


// WATCH
// -------------------------------------------------------

gulp.task('watch', function () {

    console.log($.util.colors.grey('Watching changes...'));


    // Watch Html-files
    gulp.watch(paths.src + '*.html', ['markup']);
    gulp.watch(paths.src + 'partials/**/*', ['markup:partials']);

    // Watch Styles
    gulp.watch(paths.styles.src + '**/*.less', ['styles']);

    // Watch Scripts
    gulp.watch(paths.scripts.src + '**/*.js', ['scripts:hint']);
    gulp.watch('bower.json', ['scripts:vendor']);

    // Watch Images
    gulp.watch(paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}', ['images:optimize']);

    // Watch Fonts
    gulp.watch(paths.fonts.src + '**/*', ['fonts']);
    gulp.watch(paths.images.src + 'icons/**/*.svg', ['fonts:icons']);
});


// SERVE
// -------------------------------------------------------

// Watch Files For Changes & Reload
gulp.task('serve', function () {
    console.log($.util.colors.grey('Launching server...'));

    browserSync({
        server: {
            baseDir: paths.dest
        },
        logConnections: true,
        logPrefix: 'RAE'
    });

});


// DEPLOY
// -------------------------------------------------------

gulp.task('deploy', function () {

    var configFtp = require('./config-ftp.json'),
        conn = ftp.create(configFtp.server);

    if (isServe) {

        console.log($.util.colors.grey('Watching changes...'));

        gulp.watch(paths.dest + '**/*')
            .on('change', function (event) {

                console.log($.util.colors.cyan('Updating remote...'));

                return gulp.src([event.path], {
                    base: paths.dest,
                    buffer: false
                })
                    .pipe(conn.newerOrDifferentSize(configFtp.server.remotePath))
                    .pipe(conn.dest(configFtp.server.remotePath));
            });

    } else {

        return gulp.src(paths.dest + '**/*', {
            base: paths.dest,
            buffer: false
        })

            .pipe(conn.newerOrDifferentSize(configFtp.server.remotePath))
            .pipe(conn.dest(configFtp.server.remotePath));
    }

});
