cd "$(dirname "$0")/.."
if [ ! -d node_modules ];then
    sudo npm install && bower install
fi
gulp build:iconfont
