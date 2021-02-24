#!/bin/bash
#set -x

rm pickbot/src/data/export/*.mp4
rm -rf pickbot/src/data/tasks/*
rm -rf pickbot/src/data/uploads/*

echo "dropping database..."

docker exec -it fe-pickbot_mongo_1 mongo --eval 'db.dropDatabase()' fe_pp
