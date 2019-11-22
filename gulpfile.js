/*jslint node:true*/

'use strict';

// REQUIRES
// -------------------------------------------------------

const {
    src,
    dest,
    parallel,
    series,
    watch
} = require('gulp');
const fs = require('fs');
const del = require('del');
const pkg = require('./package.json');
const config = require('./config.json');
const flags = require('minimist')(process.argv.slice(2));

//PLUGINS
const postCss_autoprefixer = require('autoprefixer');
const bowerFiles = require("main-bower-files");
const browserSync = require('browser-sync');
const inject = require('gulp-inject-string');
const ftp = require('vinyl-ftp');
const postCss_flexbugsFixes = require('postcss-flexbugs-fixes');
const postCss_objectFit = require('postcss-object-fit-images');
const postCss_cssMqpacker = require('css-mqpacker');
const postCss_cssnano = require('cssnano');
const colors = require('ansi-colors');
const through = require('through2');
const newer = require('gulp-newer');
const less = require('gulp-less');
const postCss = require('gulp-postcss');
const size = require('gulp-size');
const rename = require('gulp-rename');
const header = require('gulp-header');
const htmlClean = require('gulp-htmlclean');
const preprocess = require('gulp-preprocess');
const gulpIf = require('gulp-if');
const concat = require('gulp-concat');
const jshint = require('gulp-jshint');
const imagemin = require('gulp-imagemin');
const favicons = require('gulp-favicons');
const uglify = require('gulp-uglify');
const svgMin = require('gulp-svgmin');
const svgSprite = require('gulp-svg-sprite');


// VARIABLES
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
            host: configFtp.development.host,
            port: configFtp.development.port,
            user: configFtp.development.user,
            password: configFtp.development.password,
            parallel: 5,
            reload: true,
            log: null
        }),
        remoteProd = ftp.create({
            host: configFtp.production.host,
            port: configFtp.production.port,
            user: configFtp.production.user,
            password: configFtp.production.password,
            parallel: 5,
            reload: true,
            log: null
        });
}

// Timestamp

var runTimestamp = Math.round(Date.now() / 1000);


// DEFAULT TASKS
// -------------------------------------------------------

//gulp.task('default', ['clean'], function () {

exports.default = init;
exports.development = development;
exports.production = production;



function init(done) {

    if (isProduction) {

        console.log(colors.bold(colors.green('Production mode')));

        series(production);
    } else {

        console.log(colors.bold(colors.green('Development mode')));

        series(development);
    }
    done();
}

function development(done) {

    series(markupAll, styles, scripts, images, icons),
        function () {
            if (isServe && isDeploy) {
                parallel(serve, watchFiles, deployWatch);
            } else if (isDeploy) {
                parallel(deploy);
            } else if (isServe) {
                parallel(serve, watch);
            }
        }
    done();
}

function production() {
    series(images, parallel(markup, styles, scripts, icons, copy)),
        function (done) {
            console.log(colors.bold(colors.green('✔ Build done!')));

            if (isServe) {
                parallel(serve);
            } else if (isDeploy) {
                parallel(deploy);
            }
            done();

        }
}

// MARKUP
// -------------------------------------------------------

exports.markup = markup;
exports.markupAll = markupAll;

var markupProcess = function (isNotPartial) {
    return src(paths.src + '**/*.{html,php}', {
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
        .pipe(dest(paths.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
};

// Markup : Main (process only main files)
function markup(done) {
    return markupProcess(true);
    done();

}


// Markup : All (process all files)
function markupAll(done) {
    return markupProcess();
    done();

}

// STYLES
// -------------------------------------------------------

exports.styles = styles;

function styles(done) {

    return src(paths.styles.src + 'style.less')
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
        .pipe(dest(paths.styles.dest))

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
        .pipe(gulpIf(isProduction, dest(paths.styles.dest)))
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

}

// SCRIPTS
// -------------------------------------------------------

//const scriptsMain = series(scriptsHint, scriptsMain);
const scripts = series(scriptsHint, scriptsMain, scriptsVendor);


exports.scripts = scripts;
exports.scriptsMain = series(scriptsHint, scriptsMain);
exports.scriptsVendor = scriptsVendor;
exports.scriptsHint = scriptsHint;

// Scripts : Main
function scriptsMain(done) {
    return src(paths.scripts.src + '**/*.js')

        .pipe(concat('main.js'))
        .pipe(dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, uglify()))
        .on('error', handleErrors)
        .pipe(gulpIf(isProduction, rename({
            suffix: '.min'
        })))
        .pipe(dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, size({
            gzip: false,
            title: 'Scripts:main'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

}
// Scripts : Vendor
function scriptsVendor(done) {
    return src(bowerFiles('**/*.js'), {
            base: './bower_components'
        })
        .pipe(concat('vendor.js'))
        .pipe(dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, uglify()))
        .on('error', handleErrors)
        .pipe(gulpIf(isProduction, rename({
            suffix: '.min'
        })))
        .pipe(dest(paths.scripts.dest))
        .pipe(gulpIf(isProduction, size({
            gzip: false,
            title: 'Scripts:Vendor'
        })))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

}


// Scripts : Hint
function scriptsHint(done) {
    return src(paths.scripts.src + '**/*.js')
        .pipe(jshint())
    //.pipe(jshint.reporter('jshint-stylish'));
    done();

}


// IMAGES
// -------------------------------------------------------

const imagesFavicons = series(imagesFaviconsBuild, imagesFaviconsWordpress);
const images = series(imagesOptimize, imagesFavicons);

exports.images = images;
exports.imagesOptimize = imagesOptimize;
exports.imagesFavicons = imagesFavicons;

// Images : Optimize
function imagesOptimize(done) {
    return src([paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}',
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
        .pipe(dest(paths.images.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

}

// Images : FaviconsBuild

function imagesFaviconsBuild(done) {

    if (isProduction) {
        fs.writeFileSync(paths.src + 'partials/favicons.html', '');

        return src(paths.images.src + '/favicon.png')
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
                html: '../../partials/favicons.html',
                pipeHTML: true,
                replace: true,
            }))
            .pipe(imagemin())
            .pipe(dest(paths.images.dest + 'favicons'));

    }
    done();

}

// Images : FaviconsWordpress
function imagesFaviconsWordpress(done) {

    if (config.wordpressTheme && isProduction) {
        return src(paths.dest + 'partials/favicons.html')
            .pipe(inject.beforeEach(config.faviconsPath, '<? echo get_template_directory_uri(); ?>/'))
            .pipe(dest(paths.src + 'partials/'));
    }
    done();

}

// ICONS (svg sprites)
// -------------------------------------------------------

exports.icons = icons;

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

function icons(done) {
    return src(paths.images.src + 'icons/**/*.svg')

        .pipe(svgMin(svgMinConfig))
        .pipe(dest(paths.images.dest + 'icons/'))
        .pipe(svgSprite(svgSpritesConfig))
        .pipe(dest(paths.images.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
    done();

}


// COPY
// -------------------------------------------------------

const copy = series(copyRoot, copyHtaccess, copyAssets, copyFonts);

exports.copy = copy;


// Copy : Root
function copyRoot(done) {
    return src([
        paths.src + '**/*',
        '!' + paths.src + '**/*.{php,html}',
        '!' + paths.images.src + '**/*',
        '!' + paths.styles.src + '**/*',
        '!' + paths.scripts.src + '**/*',
        '!' + paths.fonts.src + '**/*',
        '!' + paths.assets.src + '**/*'], {
            dot: true
        })
        .pipe(dest(paths.dest));
    done();

}

// Copy : Htaccess
function copyHtaccess(done) {
    return src('node_modules/apache-server-configs/dist/.htaccess', {
            dot: true
        })
        .pipe(gulpIf(config.wordpressTheme, rename({
            extname: '.bak'
        })))
        .pipe(dest(paths.dest));
    done();

}

// Copy : Assets
function copyAssets(done) {
    return src(paths.assets.src + '**/*')
        .pipe(dest(paths.assets.dest));
    done();

}

// Copy : Fonts
function copyFonts(done) {
    return src(paths.fonts.src + '**/*.{ttf,woff,woff2}')
        .pipe(dest(paths.fonts.dest));
    done();

}

// CLEAN
// -------------------------------------------------------

exports.clean = clean;
exports.cleanRemote = cleanRemote;


// Clean
function clean(done) {
    console.log(colors.bold(colors.cyan('Cleaning ' + paths.dest + ' -folder')));
    del.sync([paths.dest + '**']);
    console.log(colors.bold(colors.green('Clean Done')));

    done();

}

// Clean : Remote
function cleanRemote(done) {

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

}

// WATCH
// -------------------------------------------------------

exports.watchFiles = watchFiles;

function watchFiles(done) {

    console.log(colors.bold(colors.grey('Watching files...')));

    // Watch Html-files
    watch([paths.src + '**/*.{php,html}',
        '!' + paths.src + 'partials/**/*'], parallel(markup));
    watch(paths.src + 'partials/**/*', parallel(markupAll));

    // Watch Styles
    watch(paths.styles.src + '**/*.less', parallel(styles));

    // Watch Scripts
    watch(paths.scripts.src + '**/*.js', parallel(scriptsMain));
    watch('package.json', parallel(scriptsVendor));

    // Watch Images
    watch([
        paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}',
        '!' + paths.images.src + 'icons/**/*'], parallel(imagesOptimize));

    // Watch Icons
    watch(paths.images.src + 'icons/**/*.svg', parallel(icons));

    done();

}


// SERVE
// -------------------------------------------------------

exports.serve = serve;

// Watch Files For Changes & Reload
function serve(done) {
    console.log(colors.bold(colors.grey('Launching server...')));

    browserSync({
        server: {
            baseDir: paths.dest
        },
        logConnections: true,
        logPrefix: 'RAE',
        notify: false
    });
    done();

}

// DEPLOY
// -------------------------------------------------------

//const deploy = series(cleanRemote, deploy);
//const deployWatch = series(deploy, deployWatch);

exports.deploy = series(cleanRemote, deploy);
exports.deployWatch = series(deploy, deployWatch);

function deploy(done) {

    var globs = [
        paths.dest + '**',
        paths.dest + '.htaccess'
    ];

    return src(globs, {
            base: paths.dest,
            buffer: false,
            allowEmpty: true
        })

        .pipe(gulpIf(isProduction, (remoteProd.dest(configFtp.production.remotePath))))

        .pipe(gulpIf(!isProduction, (remoteDev.dest(configFtp.development.remotePath))));

    done();

}

function deployWatch(done) {

    console.log(colors.bold(colors.grey('Watching changes...')));


    watch(paths.dest + '**/*')
        .on('change', function (event) {

            console.log(colors.bold(colors.cyan('Uploading file "' + event.path + '", ' + event.type)));

            return src([event.path], {
                    base: paths.dest,
                    buffer: false
                })
                .pipe(remoteDev.newer(configFtp.development.remotePath))
                .pipe(remoteDev.dest(configFtp.development.remotePath));
        });
    done();
}
