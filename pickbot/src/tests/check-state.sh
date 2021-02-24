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

checkState(){
  token=$1
  curl --location --request GET "$host/api/check-state" \
  --header "token: $token"
}

token=`getTokenWithLogin`
echo "token: $token"
checkState $token