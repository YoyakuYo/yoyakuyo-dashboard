#!/bin/bash
# Bash script to kill process on a specific port (Linux/Mac)

PORT=$1

if [ -z "$PORT" ]; then
    echo "Usage: ./kill-port.sh <port>"
    exit 1
fi

echo "Checking for processes on port $PORT..."

PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
    echo "No process found on port $PORT"
    exit 0
fi

echo "Found process: PID $PID"
echo "Killing process $PID..."
kill -9 $PID
echo "Process $PID killed successfully."

