/*jslint node:true*/

(function () {

    'use strict';

    var gulp = require('gulp'),
        $ = require('gulp-load-plugins')(),
        del = require('del'),
        runSequence = require('run-sequence'),
        bowerFiles = require('main-bower-files'),
        browserSync = require('browser-sync'),
        reload = browserSync.reload,
        ftp = require('vinyl-ftp'),
        pkg = require('./package.json'),

        // Config paths to project folders
        basePaths = {
            src: './src/',
            dest: './dist/'
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

        // Browser support config
        browserSupport = [
            'last 3 version',
            '> 1%',
            'ie >= 9'
        ],

        // Set name of your iconfont
        fontName = 'icons',

        // Banner to add to file headers
        banner = ['/*',
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


    // Inject JavaScripts from scripts and bower_components-folders
    gulp.task('inject:scripts', function () {
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
    gulp.task('serve:styles', function () {
        // For best performance, don't add Less partials to `gulp.src`
        return gulp.src(paths.styles.src + 'style.less')
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


    // Build & lint JavaScript
    gulp.task('build:scripts', function () {
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
    gulp.task('build:styles', function () {
        // For best performance, don't add Less partials to `gulp.src`
        return gulp.src(paths.styles.src + 'style.less')
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
            .pipe($.combineMediaQueries())
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


    // Build optimized images
    gulp.task('build:images', function () {
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


    // Iconfont
    gulp.task('build:iconfont', function () {
        return gulp.src(paths.images.src + 'icons/*.svg')
            .pipe($.imagemin())
            .pipe($.iconfont({
                fontName: fontName,
                //autohint: true,
                centerHorizontally: true,
                descent: (14 * 7) //pixelgrid x baseline shift
            }))
            .on('glyphs', function (glyphs) {
                var options = {
                    glyphs: glyphs,
                    fontName: fontName,
                    fontPath: '../fonts/',
                    className: 'icon'
                };
                //console.log(glyphs, options);
                // build less-file for development
                gulp.src('./templates/_iconfont/icons.less')
                    .pipe($.consolidate('lodash', options))
                    .pipe($.rename({
                        basename: 'icons'
                    }))
                    .pipe(gulp.dest(paths.styles.src + 'objects'));
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
    gulp.task('dist:bundle', function () {
        var assets = $.useref.assets({
            searchPath: ['./.tmp', paths.src, '.']
        });

        return gulp.src(paths.src + '**/*.html')
            .pipe($.injectString.before('</head>', '<link rel="favicons" href="images/favicon-1024x1024.png">'))
            .pipe(assets)
            // Concatenate And Minify JavaScript
            .pipe($.if('*.js', $.uglify({})))
            // Concatenate And Minify Styles
            // In case you are still using useref build blocks
            .pipe($.if('*.css', $.csso()))
            .pipe(assets.restore())
            .pipe($.useref())
            .pipe($.replace('/style.css', '/style.min.css'))
            .pipe(gulp.dest(paths.dest))
            .pipe($.size({
                gzip: false,
                showFiles: false,
                title: 'Bundle'
            }));
    });


    // Favicons
    gulp.task('dist:favicons', function () {
        return gulp.src(paths.dest + 'index.html')
            .pipe($.favicons({
                files: {
                    dest: '.' + paths.dest,
                    iconsPath: '/'
                },
                icons: {
                    android: true,
                    appleIcon: true,
                    appleStartup: false,
                    coast: false,
                    favicons: true,
                    firefox: false,
                    opengraph: true,
                    windows: true,
                    yandex: false
                },
                settings: {
                    background: '#ffffff',
                    index: 'index.html'
                }
            }))
            .pipe(gulp.dest(paths.dest))
            .pipe($.size({
                gzip: false,
                showFiles: false,
                title: 'Favicons'
            }));
    });

    gulp.task('dist:templates', function () {
        return gulp.src(paths.dest + '**/*.html')
            .pipe($.minifyHtml({conditionals: true}))
            .pipe(gulp.dest(paths.dest))
            .pipe($.size({
                gzip: false,
                showFiles: false,
                title: 'Templates'
            }));
    });


    // Copy all files at root level of src-folder to Output-folder
    gulp.task('dist:copy', function () {
        return gulp.src([
            !paths.src + '**/*.html',
            !paths.images.src + '**/*',
            !paths.styles.src + '**/*',
            !paths.scripts.src + '**/*',
            !paths.fonts.src + '**/*',
            !paths.assets.src + '**/*',
            paths.src + '*',
            'node_modules/apache-server-configs/dist/.htaccess'], {
            dot: true
        })
            .pipe(gulp.dest(paths.dest))
            .pipe($.size({
                title: 'Copy'
            }));
    });


    // Copy Web Fonts To Output-folder
    gulp.task('dist:fonts', function () {
        return gulp.src(paths.fonts.src + '*')
            .pipe(gulp.dest(paths.fonts.dest))
            .pipe($.size({
                title: 'Fonts'
            }));
    });

    // Copy Other design assets Output-folder
    gulp.task('dist:assets', function () {
        return gulp.src(paths.assets.src + '**/*')
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
    gulp.task('serve', ['serve:styles', 'inject:scripts'], function () {
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
        gulp.watch(paths.styles.src + '**/*.less', ['serve:styles']);
        gulp.watch(paths.scripts.src + '*.js', ['build:scripts']);
        gulp.watch('bower.json', ['inject:scripts']);
        gulp.watch(paths.images.src + '**/*.{gif,jpg,jpeg,png,svg}', reload);
        gulp.watch(paths.images.src + 'icons/**/*.svg', ['build:iconfont']);
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
    gulp.task('default', function (callback) {
        runSequence(['clean'],
                    ['build:styles', 'build:images', 'build:scripts'],
                    ['inject:scripts'],
                    ['dist:bundle'],
                    ['dist:favicons'],
                    ['dist:copy', 'dist:fonts', 'dist:assets', 'dist:templates'],
                    callback);
    });


    gulp.task('deploy', ['default'], function () {
        var config = require('./ftp-config.json'),
            conn = ftp.create(config.server),
            globs = [paths.dest + '**'];

        return gulp.src(globs, {
            base: paths.dest,
            buffer: false
        })
            .pipe(conn.differentSize(config.server.remotePath))
            .pipe(conn.dest(config.server.remotePath));
    });


}());
