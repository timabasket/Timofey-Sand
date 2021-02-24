#!/bin/bash
#set -x
date

host="http://localhost:3000"
login="tester"
password="123456"

clear(){
  rm $HOME/api_kernel/data/export/*.mp4
  rm $HOME/api_kernel/data/export/*.jpg
  rm -rf $HOME/api_kernel/data/tasks/*
  echo "dropping database..."
  mongo --eval 'db.dropDatabase()' fe_pp
}

getTokenWithLogin(){
  curl --location --request POST "$host/api/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{
    \"login\":\"$login\",
    \"password\":\"$password\"
  }" | awk -F '"' {'print $8'}
}

getTokenWithSignup(){
  curl --location --request POST "$host/api/signup" \
  --header 'Content-Type: application/json' \
  --data-raw "{
    \"login\":\"$login\",
    \"password\":\"$password\"
  }" | awk -F '"' {'print $12'}
}

testPreview(){
  token=$1
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f6.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f7.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f104.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f104.mp4" \
  --form 'template=tpl-karting-preview-01'
}

testVideo(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f1.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f2.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f2-2.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f3.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f3-2.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f4.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f4-2.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f5.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f5-2.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f6.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f6-2.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f7.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f7-2.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f103.mp4" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/f103.mp4" \
  --form "template=$tpl"
}

testVideo8Mar(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/fragment-01.mp4" \
  --form "template=$tpl"
}

testVideo9May(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "images=@$HOME/api_kernel/tests/data/files/image-01.jpg" \
  --form "texts=1Иван Петрович,1Иванов,1лейтенант,1921-1941" \
  --form "template=$tpl"
}

testTplVideoImageAndText(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/fragment-01.mp4" \
  --form "images=@$HOME/api_kernel/tests/data/files/image-01.png" \
  --form "texts=08.04.2020" \
  --form "template=$tpl"
}
#--form "noTranscoding=yes"

testVideoTeathre(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/landscape-video.mp4" \
  --form "images=@$HOME/api_kernel/tests/data/files/image-01.jpg" \
  --form "images=@$HOME/api_kernel/tests/data/files/image-02.jpg" \
  --form "texts=подпись1,подпись2,подпись3" \
  --form "template=$tpl"
}

testVideoKoni(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/landscape-video.mp4" \
  --form "images=@$HOME/api_kernel/tests/data/files/image-01.png" \
  --form "texts=подпись1,подпись2,подпись3" \
  --form "template=$tpl"
}

testTplVideoImageOnly(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "images=@$HOME/api_kernel/tests/data/files/image-01.png" \
  --form "texts=08.04.2020" \
  --form "template=$tpl"
}
#--form "noTranscoding=yes"

testTplVideoVideoOnly(){
  token=$1
  tpl=$2
  curl --location --request POST "$host/api/pp" \
  --header 'Content-Type: multipart/form-data' \
  --header "token: $token" \
  --form "fragments=@$HOME/api_kernel/tests/data/files/fragment-01.mp4" \
  --form "texts=08.04.2020" \
  --form "template=$tpl"
}

#--form "images=@$HOME/api_kernel/tests/data/files/image-01.png" \

clear
#exit 0
#token=`getTokenWithLogin`
token=`getTokenWithSignup`
#echo "token: $token"

### ACTUAL TESTS -- BEGIN ###
#for i in {1..10} ; do

for i in {1..4} ; do
testVideoKoni $token "template-koni" &
#testVideo8Mar $token "tpl-2020-03" &
#testVideo9May $token "template-2020-05-09" &
#done
#echo 'sleep'
#sleep 3s
done

#testTplVideoVideoOnly $token "template-aquatoriya-01"
#testTplVideoImageOnly $token "template-aquatoriya-02"
#testTplVideoImageAndText $token "template-aquatoriya-03"
#testVideoTeathre $token "template-teathre-01"

### ACTUAL TESTS -- END ###


#for i in {1..16} ; do
#    testPreview $token &
#done

#for i in {1..1} ; do
#    testVideo $token "template-full--day-2" &
#done



#testVideo $token "template-pedistal--day-1" &
#testVideo $token "template-pedistal--day-2" &
#testVideo $token "template-pedistal--day-3" &
#testVideo $token "template-pedistal--night-1" &
#testVideo $token "template-pedistal--night-2" &
#testVideo $token "template-pedistal--night-3" &

#testVideo $token "template-full--day-1" &
#testVideo $token "template-full--day-2" &
#testVideo $token "template-full--day-3" &
#testVideo $token "template-full--night-1" &
#testVideo $token "template-full--night-2" &
#testVideo $token "template-full--night-3" &

#testVideo $token "template-selfie--day-1" &
#testVideo $token "template-selfie--day-2" &
#testVideo $token "template-selfie--day-3" &
#testVideo $token "template-selfie--night-1" &
#testVideo $token "template-selfie--night-2" &
#testVideo $token "template-selfie--night-3" &

#testVideo $token "template-race--day-1" &
#testVideo $token "template-race--day-2" &
#testVideo $token "template-race--day-3" &
#testVideo $token "template-race--night-1" &
#testVideo $token "template-race--night-2" &
#testVideo $token "template-race--night-3" &
#testVideo $token "tpl-karting-preview-01" &

