#!/bin/bash
# Auto-restart server script for Noor
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting Noor dev server..."
  npx next dev --port 3000 2>&1 &
  SERVER_PID=$!
  
  # Wait and check if alive
  sleep 5
  if kill -0 $SERVER_PID 2>/dev/null; then
    echo "[$(date)] Server running (PID: $SERVER_PID)"
    # Keep checking every 30s
    while kill -0 $SERVER_PID 2>/dev/null; do
      sleep 30
      # Also verify it responds
      if ! curl -s -o /dev/null -w "" http://localhost:3000/ 2>/dev/null; then
        echo "[$(date)] Server not responding, killing..."
        kill $SERVER_PID 2>/dev/null
        break
      fi
    done
  else
    echo "[$(date)] Server failed to start, retrying in 5s..."
  fi
  
  echo "[$(date)] Server died, restarting in 3s..."
  kill $SERVER_PID 2>/dev/null
  sleep 3
done
