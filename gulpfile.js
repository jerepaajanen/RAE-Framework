/*jslint node:true*/

'use strict';

// REQUIRES
// -------------------------------------------------------

const bowerFiles = require("main-bower-files");
const browserSync = require('browser-sync');
const colors = require('ansi-colors');
const concat = require('gulp-concat');
const config = require('./config.json');
const del = require('del');
const exec = require('gulp-exec');
const favicons = require('gulp-favicons');
const flags = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const ftp = require('vinyl-ftp');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const header = require('gulp-header');
const htmlClean = require('gulp-htmlclean');
const homeDir = require('os').homedir();
const imagemin = require('gulp-imagemin');
const inject = require('gulp-inject-string');
const jshint = require('gulp-jshint');
const less = require('gulp-less');
const newer = require('gulp-newer');
const pkg = require('./package.json');
const postCss = require('gulp-postcss');
const postCss_autoprefixer = require('autoprefixer');
const postCss_cssMqpacker = require('css-mqpacker');
const postCss_cssnano = require('cssnano');
const postCss_flexbugsFixes = require('postcss-flexbugs-fixes');
const postCss_objectFit = require('postcss-object-fit-images');
const preprocess = require('gulp-preprocess');
const rename = require('gulp-rename');
const size = require('gulp-size');
const svgMin = require('gulp-svgmin');
const svgSprite = require('gulp-svg-sprite');
const through = require('through2');
const uglify = require('gulp-uglify');


// VARIABLES
// -------------------------------------------------------

var
    isProduction = (flags.production || flags.p) || false,
    isServe = (flags.serve || flags.s) || false,
    isDeploy = (flags.deploy || flags.d) || false,
    isLocal = (flags.local || flags.l) || false;


var
    basePaths = {
        src: config.folders.src,
        dest: config.folders.dest,
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

    localWp = homeDir + '/local-sites/' + config.localProjectName + '/app/public/wp-content/themes/' + config.themeName,


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
    console.log(colors.white('Using '), colors.magenta('config-ftp.json'));


    var remoteDev = ftp.create({
            host: configFtp.development.host,
            port: configFtp.development.port,
            user: configFtp.development.user,
            password: configFtp.development.password,
            parallel: 10,
            maxConnections: 5,
            reload: true,
            log: null
        }),
        remoteProd = ftp.create({
            host: configFtp.production.host,
            port: configFtp.production.port,
            user: configFtp.production.user,
            password: configFtp.production.password,
            parallel: 10,
            maxConnections: 5,
            reload: true,
            log: null
        });
}


// MARKUP
// -------------------------------------------------------

var markupProcess = function (isNotPartial) {
    return gulp.src(paths.src + '**/*.{html,php}', {
            base: paths.src
        })
        //.pipe(isNotPartial || isProduction ? newer(paths.dest) : through.obj())
        .pipe(isNotPartial ? newer(paths.dest) : through.obj())
        .pipe(preprocess({
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
        .pipe(gulpIf(isProduction, htmlClean()))
        .pipe(gulp.dest(paths.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
};

// Markup : Main (process only main files)
gulp.task('markup', function (done) {
    return markupProcess(true);
    done();

});


// Markup : All (process all files)
gulp.task('markupAll', function (done) {
    return markupProcess();
    done();

});


// STYLES
// -------------------------------------------------------

gulp.task('styles', function (done) {

    return gulp.src(paths.styles.src + 'style.less')
        .pipe(less({
            relativeUrls: true,
            compress: false
        }))
        .on('error', handleErrors)
        .pipe(postCss([
            postCss_flexbugsFixes,
            postCss_objectFit,
            postCss_autoprefixer({
                //Supported browsers stored in .browserslistrc
            })
        ]))
        .pipe(gulp.dest(paths.styles.dest))

        .pipe(gulpIf(isProduction, postCss([
            postCss_flexbugsFixes,
            postCss_objectFit,
            postCss_autoprefixer({
                //Supported browsers stored in .browserslistrc
            }),
            postCss_cssMqpacker({
                sort: true
            }),
            postCss_cssnano({
                preserveHacks: true,
                removeAllComments: true
            })
        ])))

        .pipe(gulpIf(isProduction, header(banner, {
            pkg: pkg
        })))
        .pipe(gulpIf(isProduction, rename({
            suffix: '.min'
        })))
        .pipe(gulpIf(isProduction, gulp.dest(paths.styles.dest)))
        .pipe(gulpIf(isProduction, size({
            gzip: false,
            title: 'Styles'
        })))
        .pipe(gulpIf(isProduction, size({
            gzip: true,
            title: 'Styles'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

});


// SCRIPTS
// -------------------------------------------------------

// Scripts : Hint
gulp.task('scriptsHint', function (done) {

    return gulp.src(paths.scripts.src + '**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
    done();

});

// Scripts : Main
gulp.task('scriptsMain', gulp.series('scriptsHint', function scriptsMainCompiling(done) {
    return gulp.src(paths.scripts.src + '**/*.js')

        .pipe(concat('main.js'))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, uglify()))
        .on('error', handleErrors)
        .pipe(gulpIf(isProduction, rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, size({
            gzip: false,
            title: 'Scripts:main'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

}));

// Scripts : Vendor
gulp.task('scriptsVendor', function (done) {

    return gulp.src(bowerFiles('**/*.js'), {
            base: './bower_components'
        })
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, uglify()))
        .on('error', handleErrors)
        .pipe(gulpIf(isProduction, rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, size({
            gzip: false,
            title: 'Scripts:Vendor'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

});

gulp.task('scripts', gulp.series('scriptsMain', 'scriptsVendor'));

// IMAGES
// -------------------------------------------------------

// Images : Optimize
gulp.task('imagesOptimize', function (done) {
    return gulp.src([paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}',
                    '!' + paths.images.src + 'icons/**/*.svg'])
        .pipe(gulpIf(!isProduction, newer(paths.images.dest)))
        .pipe(gulpIf(isProduction, (imagemin([
                imagemin.gifsicle({
                interlaced: true
            }),
                imagemin.jpegtran({
                progressive: true
            }),
                imagemin.optipng({
                optimizationLevel: 7
            })
            ]))))
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

});

// Images : Favicons-Build
gulp.task('imagesFaviconsBuild', function (done) {

    if (isProduction) {
        fs.writeFileSync(paths.src + 'partials/favicons.html', '');

        return gulp.src(paths.images.src + '/favicon.png')
            .pipe(favicons({
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
                html: '../../../' + paths.src + 'partials/favicons.html',
                pipeHTML: true,
                replace: true,
            }))
            .pipe(imagemin())
            .pipe(gulp.dest(paths.images.dest + 'favicons'));

    }
    done();

});

// Images : FaviconsMarkup (for Wordpress)
gulp.task('imagesFavicons', gulp.series('imagesFaviconsBuild', function imagesFaviconsMarkup(done) {

    if (config.wordpressTheme && isProduction) {
        return gulp.src(paths.src + 'partials/favicons.html')
            .pipe(inject.beforeEach(config.faviconsPath, '<? echo get_template_directory_uri(); ?>/'))
            .pipe(gulp.dest(paths.src + 'partials/'));
    }
    done();

}));

// Images
gulp.task('images', gulp.series('imagesOptimize', 'imagesFavicons'));


// ICONS (svg sprites)
// -------------------------------------------------------

// Save svg with style element to stript all styles, else with style attributes i.e. to save fill colors.

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
            inlineStyles: false
            }, {
            removeAttrs: {
                attrs: '(class|xmlns)'
            }
            }, {
            sortAttrs: true
            }]
    },
    svgSpritesConfig = {
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

gulp.task('icons', function (done) {
    return gulp.src(paths.images.src + 'icons/**/*.svg')

        .pipe(svgMin(svgMinConfig))
        .pipe(gulp.dest(paths.images.dest + 'icons/'))
        .pipe(svgSprite(svgSpritesConfig))
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

});


// COPY
// -------------------------------------------------------

// Copy : Root
gulp.task('copyRoot', function (done) {
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
    done();

});

// Copy : Htaccess
gulp.task('copyHtaccess', function (done) {
    return gulp.src('node_modules/apache-server-configs/dist/.htaccess', {
            dot: true
        })
        .pipe(gulpIf(config.wordpressTheme, rename({
            extname: '.bak'
        })))
        .pipe(gulp.dest(paths.dest));
    done();

});

// Copy : Assets
gulp.task('copyAssets', function (done) {
    return gulp.src(paths.assets.src + '**/*')
        .pipe(gulp.dest(paths.assets.dest));
    done();

});

// Copy : Fonts
gulp.task('copyFonts', function (done) {
    return gulp.src(paths.fonts.src + '**/*.{ttf,woff,woff2}')
        .pipe(gulp.dest(paths.fonts.dest));
    done();

});

// Copy
gulp.task('copy', gulp.series('copyRoot', 'copyHtaccess', 'copyAssets', 'copyFonts'));


// CLEAN
// -------------------------------------------------------

// Clean
gulp.task('clean', function (done) {
    console.log(colors.cyan('Cleaning ' + paths.dest + ' -folder'));
    del.sync([paths.dest]);
    console.log(colors.bold(colors.green('✔ Clean Done')));

    done();

});

// Clean : Local
gulp.task('cleanLocal', function (done) {
    console.log(colors.cyan('Cleaning ' + localWp + ' -folder'));
    del.sync([localWp], {
        force: true,
    });
    console.log(colors.bold(colors.green('✔ Clean Done')));

    done();
});

// Clean : Remote
gulp.task('cleanRemote', function (done) {

    if (isProduction) {
        console.log(colors.cyan('Cleaning ' + configFtp.production.remotePath + ' -folder on remote server...'));


        remoteProd.rmdir(configFtp.production.remotePath, function (err) {
            done();
            if (err) {
                return handleErrors;
                console.log(colors.bold(colors.green('✔ Clean Done')));

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

gulp.task('watch', function (done) {

    console.log(colors.bold(colors.grey('Watching files...')));

    // Watch Html-files
    gulp.watch([paths.src + '**/*.{php,html}',
        '!' + paths.src + 'partials/**/*'], gulp.parallel('markup'));
    gulp.watch(paths.src + 'partials/**/*', gulp.parallel('markupAll'));

    // Watch Styles
    gulp.watch(paths.styles.src + '**/*.less', gulp.parallel('styles'));

    // Watch Scripts
    gulp.watch(paths.scripts.src + '**/*.js', gulp.parallel('scriptsMain'));
    gulp.watch('bower.json', gulp.parallel('scriptsVendor'));

    // Watch Images
    gulp.watch([
        paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}',
        '!' + paths.images.src + 'icons/**/*'], gulp.parallel('imagesOptimize'));

    // Watch Icons
    gulp.watch(paths.images.src + 'icons/**/*.svg', gulp.parallel('icons'));

    done();

});


// SERVE
// -------------------------------------------------------

// Watch Files For Changes & Reload
gulp.task('serve', function (done) {

    console.log(colors.bold(colors.grey('Launching Server...')));


    if (isServe && !isLocal) {

        browserSync.init({
            server: {
                baseDir: paths.dest
            },
            //ghostMode: true,
            logConnections: true,
            logPrefix: 'RAE',
            notify: false
        });
    } else if (isLocal) {

        browserSync.init({
            proxy: {
                target: 'http://' + config.localProjectName + '.local',
                ws: true
            },
            open: true,
            injectChanges: true,
            watchOptions: {
                debounceDelay: 1000 // This introduces a small delay when watching for file change events to avoid triggering too many reloads
            },
            //ghostMode: true,
            logConnections: true,
            logPrefix: 'RAE',
            notify: false
        });

    }

    done();

});





// DEPLOY
// -------------------------------------------------------

gulp.task('deploy', gulp.series('cleanRemote', function uploading(done) {
    var globs = [
        paths.dest + '**',
        paths.dest + '.htaccess'
    ];

    console.log(colors.bold(colors.grey('Uploading files...')));


    return gulp.src(globs, {
            base: paths.dest,
            buffer: false,
            allowEmpty: true
        })

        .pipe(gulpIf(isProduction, (remoteProd.dest(configFtp.production.remotePath))))

        .pipe(gulpIf(!isProduction, (remoteDev.dest(configFtp.development.remotePath))));


    done();

}));

gulp.task('deployWatch', gulp.series('deploy', function watching(done) {

    console.log(colors.bold(colors.grey('Watching changes...')));


    var watcher = gulp.watch(paths.dest + '**/*');

    watcher.on('change', function (filePath, stats) {

        console.log(colors.white('Uploading file '), colors.magenta(filePath));

        return gulp.src(filePath, {
                base: paths.dest,
                buffer: false,
                allowEmpty: true
            })

            .pipe(remoteDev.newerOrDifferentSize(configFtp.development.remotePath))
            .pipe(remoteDev.dest(configFtp.development.remotePath));

    });

    done();

}));


gulp.task('deployLocal', function (done) {
    return gulp.src(paths.dest + '**/*', {
            read: false
        })
        .pipe(exec('cp -R ' + paths.dest + '/. ' + localWp));

    done();
});

gulp.task('deployLocalWatch', gulp.series('deployLocal', function watching(done) {

    var watcher = gulp.watch(paths.dest + '**/*');

    watcher.on('change', function (filePath, stats) {

        console.log(colors.white('Deploying file '), colors.magenta(filePath));

        return gulp.src(filePath, {
                base: paths.dest,
                buffer: false,
                allowEmpty: true
            })
            .pipe(exec('cp -R ' + paths.dest + '/. ' + localWp));
    });

    done();

}));


// DEFAULT TASKS
// -------------------------------------------------------

// Stuff to do after default tast is completed
function initAfter(done) {

    if (isProduction) {

        console.log(colors.bold(colors.green('✔ Build done!')));

        if (isServe) {

            console.log(colors.bold(colors.blue('Now serving')));

            gulp.series('serve')(done);

        } else if (isDeploy) {

            console.log(colors.bold(colors.blue('Now deploying')));

            gulp.series('deploy')(done);

        } else {

            done(); // Signal async completion
        }

    } else {

        console.log(colors.bold(colors.green('✔ All set!')));

        if (isServe && isLocal) {

            console.log(colors.bold(colors.blue('Now deploying Local & serving')));

            gulp.series('serve', 'watch', 'deployLocalWatch')(done);

        }

        if (isServe && isDeploy) {

            console.log(colors.bold(colors.blue('Now deploying & serving')));

            gulp.series('serve', 'watch', 'deployWatch')(done);

        } else if (isDeploy) {

            console.log(colors.bold(colors.blue('Now deploying')));

            gulp.series('deploy')(done);

        } else if (isServe && !isLocal) {

            console.log(colors.bold(colors.blue('Now serving')));

            gulp.series('serve', 'watch')(done);
        } else {

            done(); // Signal async completion
        }

    }

}

// Default : Development
gulp.task('initDevelopment', function (done) {

    gulp.series('markupAll', 'styles', 'scripts', 'images', 'icons', 'copy', initAfter)(done);
})

// Default : Production
gulp.task('initProduction', function (done) {

    gulp.series('images', gulp.parallel(
            'markup', 'styles', 'scripts', 'icons', 'copy'),
        initAfter)(done);
})



// Default
gulp.task('default', gulp.series('clean', function init(done) {

    if (isProduction) {

        console.log(colors.bold(colors.green('Starting Production')));

        gulp.series('initProduction')(done);
    } else {

        console.log(colors.bold(colors.green('Starting Development')));

        gulp.series('initDevelopment')(done);
    }
    done();

}));
