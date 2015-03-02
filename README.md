RAE Framework


## Environment setup

- install npm (http://nodejs.org/)
- install gulp client: $ sudo npm install -g gulp
- install gulp client: $ sudo npm install -g bower

## Install dependencies

- $ npm install
- $ bower install
- ...or just use shortcut Terminal .commands like gulp serve in ./gulp -forlder


## Gulp tasks

- $ gulp - create distribution
- $ gulp serve:dist - create distribution & test files on local server
- $ gulp serve - start local server for development
- $ gulp deploy - create distribution & deploy via ftp


## Gulp ftp-deploy

- Copy & rename ftp-config-sample.json to ftp-config.json, then edit the file and add your server auth information.
- ftp-config.json is ignored in .gitignore, so it will not be stored in version control.