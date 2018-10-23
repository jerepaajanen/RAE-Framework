/*jslint node:true*/

'use strict';

// REQUIRES
// -------------------------------------------------------

var
    gulp = require('gulp'),
    fs = require('fs'),
    del = require('del'),
    autoprefixer = require('autoprefixer'),
    flexbugsFixes = require('postcss-flexbugs-fixes'),
    postcssObjectFit = require('postcss-object-fit-images'),
    mqpacker = require('css-mqpacker'),
    cssnano = require('cssnano'),
    colors = require('ansi-colors'),
    through = require('through2'),
    sequence = require('run-sequence'),
    bowerFiles = require("main-bower-files"),
    browserSync = require('browser-sync'),
    inject = require('gulp-inject-string'),
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


// HELPERS
// -------------------------------------------------------

// Handle errors

function handleErrors(error) {
    console.log(colors.bold(colors.red(error.toString())));
    this.emit('end');
}

// Check if config-ftp.json exists

try {
    var configFtp = require('./config-ftp.json');
} catch (error) {

    console.log(colors.bold(colors.red('"config-ftp.json" file needed!')));

}

if (configFtp) {
    //console.log(configFtp);

    console.log(colors.bold(colors.grey('Using "config-ftp.json".')));



    var remoteDev = ftp.create({
            host:     configFtp.development.host,
            port:     configFtp.development.port,
            user:     configFtp.development.user,
            password: configFtp.development.password,
            parallel: 5,
            reload:   true,
            log:      null
        }),
        remoteProd = ftp.create({
            host:     configFtp.production.host,
            port:     configFtp.production.port,
            user:     configFtp.production.user,
            password: configFtp.production.password,
            parallel: 5,
            reload:   true,
            log:      null
        });
}

// Timestamp

var runTimestamp = Math.round(Date.now()/1000);

// DEFAULT TASKS
// -------------------------------------------------------

gulp.task('default', ['clean'], function () {

    if (isProduction) {

        console.log(colors.bold(colors.green('Production mode')));

        gulp.start('default:production');
    } else {

        console.log(colors.bold(colors.green('Development mode')));


        gulp.start('default:development');
    }

});

gulp.task('default:development', function () {
    sequence(['markup:all', 'styles', 'scripts', 'images', 'icons', 'copy'], function () {
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
    sequence(['images'], ['markup', 'styles', 'scripts', 'icons', 'copy'], function () {
        console.log(colors.bold(colors.green('✔ Build done!')));

        if (isServe) {
            gulp.start(['serve']);
        } else if (isDeploy) {
            gulp.start(['deploy']);
        }

    });
});

// Show all tasks
gulp.task('tasks', $.taskListing);



// MARKUP
// -------------------------------------------------------

var markupProcess = function (isNotPartial) {
    return gulp.src(paths.src + '**/*.{html,php}', {
        base: paths.src
    })
        //.pipe(isNotPartial || isProduction ? $.newer(paths.dest) : through.obj())
        .pipe(isNotPartial ? $.newer(paths.dest) : through.obj())
        .pipe($.preprocess({
            context: {
                ENV: isProduction ? 'production' : 'development',
                UA: config.analyticsUA,
                META: {
                    author: config.siteAuthor,
                    title: config.siteTitle,
                    description: config.siteDescription,
                    keywords: config.siteKeywords,
                    url: config.siteURL,
                    image: config.shareImageURL,
                    twitterHandle: config.twitterHandle
                }
            },
            extension: 'html'
        }))
        .pipe($.if(isProduction, $.htmlclean()))
        .pipe(gulp.dest(paths.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
};

// Markup : Main (process only main files)
gulp.task('markup', function () {
    return markupProcess(true);
});


// Markup : All (process all files)
gulp.task('markup:all', function () {
    return markupProcess();
});


// STYLES
// -------------------------------------------------------

gulp.task('styles', function () {

    return gulp.src(paths.styles.src + 'style.less')
        .pipe($.less({
            relativeUrls: true,
            compress: false
        }))
        .on('error', handleErrors)
        .pipe($.postcss([
            flexbugsFixes,
            postcssObjectFit,
            autoprefixer({
                browsers: config.browserSupport
            })
        ]))
        .pipe(gulp.dest(paths.styles.dest))

        .pipe($.if(isProduction, $.postcss([
            flexbugsFixes,
            postcssObjectFit,
            autoprefixer({
                browsers: config.browserSupport
            }),
            mqpacker({
                sort: true
            }),
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


// IMAGES
// -------------------------------------------------------

gulp.task('images', ['images:optimize', 'images:favicons']);


// Images : Optimize
gulp.task('images:optimize', function () {
    return gulp.src([paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}',
                    '!' + paths.images.src + 'icons/**/*.svg'])
        .pipe($.if(!isProduction, $.newer(paths.images.dest)))
        .pipe($.if(isProduction, ($.imagemin([
                $.imagemin.gifsicle({interlaced: true}),
                $.imagemin.jpegtran({progressive: true}),
                $.imagemin.optipng({optimizationLevel: 7})
            ]))))
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// Images : Favicons
gulp.task('images:favicons', ['images:favicons-generate'], function () {

    if (config.wordpressTheme && isProduction) {
        return gulp.src(paths.src + 'partials/favicons.html')
            .pipe(inject.beforeEach(config.faviconsPath, '<?php echo get_template_directory_uri(); ?>/'))
            .pipe(gulp.dest(paths.src + 'partials/'));
    }
});

gulp.task('images:favicons-generate', function () {

    if (isProduction) {
        fs.writeFileSync(paths.src + 'partials/favicons.html', '');

        return gulp.src(paths.images.src + '/favicon.png')
            .pipe($.favicons({
                appName: config.siteTitle,
                appDescription: config.siteDescription,
                url: config.siteURL,
                developerName: pkg.author,
                developerURL: pkg.homepage,
                background: config.faviconsBackground,
                path: config.faviconsPath,
                display: 'standalone',
                orientation: 'portrait',
                version: 1.0,
                logging: false,
                online: false,
                html: paths.src + 'partials/favicons.html'
            }))
            .pipe($.imagemin())
            .pipe(gulp.dest(paths.images.dest + 'favicons'));

    }



});


// ICONS (svg sprites)
// -------------------------------------------------------
var svgMinConfig = {
            plugins: [{
                removeDoctype: true
            }, {
                removeXMLProcInst: true
            }, {
                removeTitle: true
            }, {
                removeComments: true
            }, {
                removeStyleElement: true
            }, {
                sortAttrs: true
            }, {
                removeAttrs: {
                    attrs: 'class'
                }
            }]
        }
var svgSpritesConfig = {
    mode: {
        symbol: {
            dest: '.',
            inline: false,
            sprite: 'icons.svg',
            example: {
                dest: '../styleguide/icons.html'
            }
        }
    },
    shape: {
        dest: 'icons/'
    },
    svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false,
        namespaceClassnames: false
    }
};

gulp.task('icons', function() {
    return gulp.src(paths.images.src + 'icons/**/*.svg')

        .pipe($.svgmin(svgMinConfig))
        .pipe(gulp.dest(paths.images.dest + 'icons/'))
        .pipe($.svgSprite(svgSpritesConfig))
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// COPY
// -------------------------------------------------------

gulp.task('copy', ['copy:root', 'copy:htaccess', 'copy:assets', 'copy:fonts']);

// Copy : Root
gulp.task('copy:root', function () {
    return gulp.src([
        paths.src + '**/*',
        '!' + paths.src + '**/*.{php,html}',
        '!' + paths.images.src + '**/*',
        '!' + paths.styles.src + '**/*',
        '!' + paths.scripts.src + '**/*',
        '!' + paths.fonts.src + '**/*',
        '!' + paths.assets.src + '**/*'], {
        dot: true
    })
        .pipe(gulp.dest(paths.dest));
});

// Copy : Htaccess
gulp.task('copy:htaccess', function () {
    return gulp.src('node_modules/apache-server-configs/dist/.htaccess', {
        dot: true
    })
    .pipe($.if(config.wordpressTheme, $.rename({extname: '.bak'})))
    .pipe(gulp.dest(paths.dest));
});

// Copy : Assets
gulp.task('copy:assets', function () {
    return gulp.src(paths.assets.src + '**/*')
        .pipe(gulp.dest(paths.assets.dest));
});

// Copy : Fonts
gulp.task('copy:fonts', function () {
    return gulp.src(paths.fonts.src + '**/*.{ttf,woff,woff2}')
        .pipe(gulp.dest(paths.fonts.dest));
});


// CLEAN
// -------------------------------------------------------

gulp.task('clean', ['clean:files']);

// Clean : Files
gulp.task('clean:files', function () {
    console.log(colors.bold(colors.cyan('Cleaning ' + paths.dest + ' -folder')));
    del.sync([paths.dest + '**']);
    console.log(colors.bold(colors.green('Clean Done')));

});

// Clean : Remote
gulp.task('clean:remote', function (done) {

    if (isProduction) {
        console.log(colors.bold(colors.cyan('Cleaning ' + configFtp.production.remotePath + ' -folder on remote server...')));


        remoteProd.rmdir(configFtp.production.remotePath, function (err) {
            done();
            if (err) {
                return handleErrors;
                console.log(colors.bold(colors.green('Clean Done')));

            }
        });

    } else {
        console.log(colors.bold(colors.cyan('Cleaning ' + configFtp.development.remotePath + ' -folder on remote server...')));

        remoteDev.rmdir(configFtp.development.remotePath, function (err) {
            done();
            if (err) {
                return handleErrors;
                console.log(colors.bold(colors.green('Clean Done')));

            }
        });
    }

});


// WATCH
// -------------------------------------------------------

gulp.task('watch', function () {

    console.log(colors.bold(colors.grey('Watching changes...')));



    // Watch Html-files
    gulp.watch([paths.src + '**/*.{php,html}',
        '!' + paths.src + 'partials/**/*'], ['markup']);
    gulp.watch(paths.src + 'partials/**/*', ['markup:all']);

    // Watch Styles
    gulp.watch(paths.styles.src + '**/*.less', ['styles']);

    // Watch Scripts
    gulp.watch(paths.scripts.src + '**/*.js', ['scripts:main']);
    gulp.watch('package.json', ['scripts:vendor']);

    // Watch Images
    gulp.watch([
        paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}',
        '!' + paths.images.src + 'icons/**/*'], ['images:optimize']);

    // Watch Icons
    gulp.watch(paths.images.src + 'icons/**/*.svg', ['icons']);

});


// SERVE
// -------------------------------------------------------

// Watch Files For Changes & Reload
gulp.task('serve', function () {
    console.log(colors.bold(colors.grey('Launching server...')));

    browserSync({
        server: {
            baseDir: paths.dest
        },
        logConnections: true,
        logPrefix: 'RAE',
        notify: false
    });

});


// DEPLOY
// -------------------------------------------------------

gulp.task('deploy', ['clean:remote'], function () {

    var globs = [
        paths.dest + '**',
        paths.dest + '.htaccess'
    ];

    return gulp.src(globs, {
        base: paths.dest,
        buffer: false
    })

        .pipe($.if(isProduction, (remoteProd.dest(configFtp.production.remotePath))))

        .pipe($.if(!isProduction, (remoteDev.dest(configFtp.development.remotePath))));

});

gulp.task('deploy:watch', ['deploy'], function () {

    console.log(colors.bold(colors.grey('Watching changes...')));


    gulp.watch(paths.dest + '**/*')
        .on('change', function (event) {

            console.log(colors.bold(colors.cyan('Uploading file "' + event.path + '", ' + event.type)));

            return gulp.src([event.path], {
                base: paths.dest,
                buffer: false
            })
                .pipe(remoteDev.newer(configFtp.development.remotePath))
                .pipe(remoteDev.dest(configFtp.development.remotePath));
        });
});
