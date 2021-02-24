#!/bin/bash

export DEFAULT_GREETING_TEXT='GREETING TEXT'
export DEFAULT_THANKS_TEXT='THANKS TEXT'
export UPLOADTTLMINUTES=120
export TOKENTTLMINUTES=10
export PASWDSALT='123456'
export LIMITOFPROC=3

cd /srv/pickbot

if [ ! -d node_modules ]; then
  echo 'node_modules not exist. npm install...'
  npm install
fi

node ./bin/www