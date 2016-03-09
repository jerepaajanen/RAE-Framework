##RAE Framework


### Environment setup

- install npm (http://nodejs.org/)
- install gulp client: `npm install -g gulp`
- install bower: `npm install -g bower`

### Install dependencies

```bash
npm install && bower install
```
...or just open gulp-init.command


### Gulp tasks

####Launch
```bash
gulp
```

####Using enviroment modifiers

#####Serving files
– Default is to watch and serve development-files 
– Use with `--production` to serve production-files after build
– Use with `--deploy`to upload changed files to remote server
```bash
gulp --serve
```

#####Production
– Build and optimize all files
– Use with `--deploy`to build and then upload files to remote serve
```bash
gulp --production
```

#####Deploying
Deploying needs `config-ftp.json` -file to work. Copy & rename `config-ftp-sample.json` to `config-ftp.json`, then edit the file and add your server auth information.

#####Enviroment shorthands
You can use also shorthand for enviroment modifiers

`--serve`  `--s`

`--production`  `--p`

`--deploy`  `--d`
