RAE Framework


## Environment setup

- install npm (http://nodejs.org/)
- install gulp client: $ npm install -g gulp
- install gulp client: $ npm install -g bower

## Install dependencies

- $ npm install && bower install
- ...or just use shortcut Terminal .commands like gulp serve in ./gulp -forlder


## Gulp tasks


- $ gulp / Launch gulp in development-mode
- $ gulp --serve / Launch gulp + serve you development files
- $ gulp --production / Build project, optimize all files
- $ gulp --deploy / Deploy project with ftp. Copy & rename config-ftp-sample.json to config-ftp.json, then edit the file and add your server auth information.


- $ gulp fonts:icons / build iconfonts from .svg-files in src/images/icons.
    (You may want to autohint your fonts; set "autohint": "true" in config.json, and install autohint on your system with Homebrew "brew install ttfautohint --with-qt")
