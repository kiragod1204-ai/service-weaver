#!/bin/sh

# Start the backend service in the background
cd /app
./main &

# Start nginx in the foreground
nginx -g "daemon off;"