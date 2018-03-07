cd "$(dirname "$0")"
if [ ! -d node_modules ];then
    sudo npm install && yarn install
fi
gulp --s
