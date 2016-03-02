/*jslint node:true*/

'use strict';

// REQUIRES
// -------------------------------------------------------

var
    gulp = require('gulp'),
    fs = require('fs'),
    del = require('del'),
    autoprefixer = require('autoprefixer'),
    mqpacker = require('css-mqpacker'),
    cssnano = require('cssnano'),
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
    sequence(['markup', 'fonts', 'styles', 'scripts', 'images'], function () {
        if (isServe && isDeploy) {
            gulp.start(['serve', 'watch', 'deploy:watch']);
        } else if (isDeploy) {
            gulp.start(['deploy']);
        } else if (isServe) {
            gulp.start(['serve', 'watch']);
        }

    });
});

gulp.task('default:production', function () {
    sequence(['clean'], ['images', 'fonts'], ['markup', 'styles', 'scripts', 'copy'], function () {
        console.log($.util.colors.green('✔ Build done!'));
        if (isServe) {
            gulp.start(['serve']);
        } else if (isDeploy) {
            gulp.start(['deploy']);
        }

    });
});


// MARKUP
// -------------------------------------------------------

var markupProcess = function (isNotPartial) {
    gulp.src(paths.src + '**/*.html', {
        base: paths.src
    })
        .pipe(isNotPartial || isProduction ? $.changed(paths.dest) : $.util.noop())
        .pipe($.preprocess({
            context: {
                ENV: isProduction ? 'production' : 'development',
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
        .pipe($.if(isProduction, $.htmlclean()))
        .pipe(gulp.dest(paths.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
};

// Markup : Main
gulp.task('markup', function () {
    return markupProcess(true);
});


// Markup : Partials
gulp.task('markup:partials', function () {
    return markupProcess();
});


// STYLES
// -------------------------------------------------------

gulp.task('styles', function () {

    return gulp.src(paths.styles.src + 'style.less')
        .pipe($.less({
            compress: false
        }))
        .on('error', handleErrors)
        .pipe($.postcss([
            autoprefixer({
                browsers: config.browserSupport
            })
        ]))
        .pipe(gulp.dest(paths.styles.dest))

        .pipe($.if(isProduction, $.postcss([
            autoprefixer({
                browsers: config.browserSupport
            }),
            mqpacker,
            cssnano({
                preserveHacks: true,
                removeAllComments: true
            })
        ])))

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


// SCRIPTS
// -------------------------------------------------------

gulp.task('scripts', ['scripts:main', 'scripts:vendor']);

// Scripts : Vendor
gulp.task('scripts:vendor', function () {
    return gulp.src(bowerFiles('**/*.js'), {
        base: './bower_components'
    })
        .pipe($.concat('vendor.js'))
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
        .pipe(gulp.dest(paths.scripts.dest))
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


// FONTS
// -------------------------------------------------------

gulp.task('fonts', function () {
    sequence(['fonts:icons'], ['fonts:convert']);
});


gulp.task('fonts:convert', function () {
    return gulp.src(paths.fonts.src + '**/*.ttf')
        .pipe($.changed(paths.fonts.dest))
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
            prependUnicode: false,
            autohint: config.iconfont.autohint,
            formats: ['ttf'],
            normalize: true,
            fontHeight: (config.iconfont.gridSize * config.iconfont.gridSize * 2),
            centerHorizontally: false,
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
            gulp.src(paths.styles.src + 'objects/icons-template.less')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({
                    basename: 'icons'
                }))
                .pipe(gulp.dest(paths.styles.src + 'objects'));

            // Build html-file for documentation
            gulp.src(paths.src + 'styleguide/icons-template.html')
                .pipe($.consolidate('lodash', options))
                .pipe($.rename({
                    basename: 'index'
                }))
                .pipe(gulp.dest(paths.src + 'styleguide/'));
        })
        .pipe(gulp.dest(paths.fonts.src));
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
            appName: config.siteTitle,
            appDescription: config.siteDescription,
            url: config.siteURL,
            developerName: pkg.author,
            developerURL: pkg.homepage,
            background: 'transparent',
            path: 'images/favicons',
            display: 'standalone',
            orientation: 'portrait',
            version: 1.0,
            logging: false,
            online: false,
            html: paths.src + 'partials/favicons.html'
        })))

        .pipe(gulp.dest(paths.images.dest + 'favicons'));

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

gulp.task('clean', ['clean:files', 'clean:cache']);

// Clean : Files
gulp.task('clean:files', function () {
    del([paths.dest + '**/*']);
});

// Clean : Cache (image)
gulp.task('clean:cache', function () {
    return $.cache.clearAll();
});


// WATCH
// -------------------------------------------------------

gulp.task('watch', function () {

    console.log($.util.colors.grey('Watching changes...'));


    // Watch Html-files
    gulp.watch(paths.src + '*.html', ['markup']);
    gulp.watch(paths.src + 'styleguide/*.html', ['markup']);
    gulp.watch(paths.src + 'partials/**/*', ['markup:partials']);

    // Watch Styles
    gulp.watch(paths.styles.src + '**/*.less', ['styles']);

    // Watch Scripts
    gulp.watch(paths.scripts.src + '**/*.js', ['scripts:main']);
    gulp.watch('bower.json', ['scripts:vendor']);

    // Watch Images
    gulp.watch(paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}', ['images:optimize']);

    // Watch Fonts
    gulp.watch(paths.fonts.src + '**/*', ['fonts:convert']);
    gulp.watch(paths.images.src + 'icons/**/*.svg', ['fonts']);
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

try {
    var configFtp = require('./config-ftp.json');
} catch (error) {

    console.log($.util.colors.red('Config-ftp.json file needed for deploy!'));

}

if (configFtp) {
    //console.log(configFtp);
    console.log($.util.colors.grey('Config-ftp.json found.'));
    var conn = ftp.create({
        host:     configFtp.server.host,
        user:     configFtp.server.user,
        password: configFtp.server.password,
        parallel: 10,
        log:      null //$.util.log
    });
}

gulp.task('deploy', function () {

    return gulp.src(paths.dest + '**', {
        base: './' + paths.dest,
        buffer: false
    })
        .pipe(conn.newer(configFtp.server.remotePath))
        .pipe(conn.dest(configFtp.server.remotePath));
        //.pipe($.if(isServe, gulp.start(['deploy:watch'])));

});

gulp.task('deploy:watch', ['deploy'], function () {

    console.log($.util.colors.grey('Watching changes...'));

    gulp.watch(paths.dest + '**')
        .on('change', function (event) {

            console.log($.util.colors.cyan('Updating remote...'));

            return gulp.src([event.path], {
                base: './' + paths.dest,
                buffer: false
            })
                .pipe(conn.newer(configFtp.server.remotePath))
                .pipe(conn.dest(configFtp.server.remotePath));
        });
});
