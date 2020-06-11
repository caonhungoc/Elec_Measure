#!/bin/bash
if [ "$#" == 1 ]; then
  python3 change_ip.py $1
  node index.js
else
  echo "Invalid argument"
fi