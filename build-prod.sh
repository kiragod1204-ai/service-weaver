#!/bin/bash

# Production build script for Service Weaver

set -e

echo "Building Service Weaver for production..."

# Build the production Docker image
echo "Building Docker image..."
docker build -f Dockerfile.prod -t service-weaver:prod .

# Optional: Tag the image for a registry
# docker tag service-weaver:prod your-registry/service-weaver:latest

echo "Production build complete!"
echo ""
echo "To run in production mode:"
echo "  docker-compose --profile production up -d"
echo ""
echo "To push to a registry:"
echo "  docker push your-registry/service-weaver:latest"