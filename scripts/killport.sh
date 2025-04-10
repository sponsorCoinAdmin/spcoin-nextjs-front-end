#!/bin/bash

PORT=$1
if [ -z "$PORT" ]; then
  echo "Usage: killport <port>"
  return 1
fi

PID=$(netstat -aon | grep ":$PORT" | grep LISTENING | awk '{print $NF}' | head -n 1)

if [ -z "$PID" ]; then
  echo "No process found listening on port $PORT."
else
  echo "Killing process with PID $PID using port $PORT..."
  taskkill //PID $PID //F
fi
