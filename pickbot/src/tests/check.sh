#!/bin/bash
#set -x

host="http://localhost:3000"
login="tester"
password="123456"

getTokenWithLogin(){
  curl --location --request POST "$host/api/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{
    \"login\":\"$login\",
    \"password\":\"$password\"
  }" | awk -F '"' {'print $8'}
}

checkT(){
  token=$1
  id=$2
  curl -v --location --request GET "$host/api/pp/$id" \
  --header "token: $token"
}

checkAll(){
  token=$1
  id=$2
  curl -v --location --request GET "$host/api/pp" \
  --header "token: $token"
}

token=`getTokenWithLogin`
echo "token: $token"
checkAll $token
