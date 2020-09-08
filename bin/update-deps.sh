#!/usr/bin/env bash

if [ -f ~/.nvm/nvm.sh ];
then
  . ~/.nvm/nvm.sh
  nvm use
fi

npm update -g npm-check-updates
npm outdated
npm update
ncu
npm-check --skip-unused -p

# ncu -u
npm outdated
# npm update
# npm outdated
# commit
# push

