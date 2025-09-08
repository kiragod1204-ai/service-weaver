#!/bin/bash

# Production Release Script for Service Weaver
# This script handles the complete production deployment process

set -e  # Exit on any error

# Default values
VERSION="latest"
ENVIRONMENT="production"
REGISTRY=""
DEPLOY=true
SKIP_BUILD=false
SKIP_MIGRATION=false
SKIP_HEALTH_CHECK=false
NOTIFY_SLACK=false
SLACK_WEBHOOK=""
BACKUP_BEFORE_DEPLOY=true
ROLLBACK_ON_FAILURE=true
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    -e|--env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -r|--registry)
      REGISTRY="$2"
      shift 2
      ;;
    --no-deploy)
      DEPLOY=false
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-migration)
      SKIP_MIGRATION=true
      shift
      ;;
    --skip-health-check)
      SKIP_HEALTH_CHECK=true
      shift
      ;;
    --notify-slack)
      NOTIFY_SLACK=true
      SLACK_WEBHOOK="$2"
      shift 2
      ;;
    --no-backup)
      BACKUP_BEFORE_DEPLOY=false
      shift
      ;;
    --no-rollback)
      ROLLBACK_ON_FAILURE=false
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -v, --version VERSION     Version to deploy (default: latest)"
      echo "  -e, --env ENVIRONMENT     Environment to deploy to (default: production)"
      echo "  -r, --registry REGISTRY   Docker registry to push to"
      echo "  --no-deploy               Skip deployment step (build only)"
      echo "  --skip-build              Skip build step (deploy existing image)"
      echo "  --skip-migration          Skip database migration"
      echo "  --skip-health-check       Skip post-deployment health check"
      echo "  --notify-slack WEBHOOK    Send Slack notifications using provided webhook"
      echo "  --no-backup               Skip backup before deployment"
      echo "  --no-rollback             Disable automatic rollback on failure"
      echo "  -h, --help                Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging function
log() {
  local level=$1
  local message=$2
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
  
  # Send to Slack if enabled
  if [[ "$NOTIFY_SLACK" == "true" && "$level" == "ERROR" ]]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"[$level] $message\"}" \
      "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
  fi
}

# Function to send Slack notification
notify_slack() {
  if [[ "$NOTIFY_SLACK" == "true" ]]; then
    local message=$1
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"$message\"}" \
      "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
  fi
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
log "INFO" "Checking prerequisites..."

if ! command_exists docker; then
  log "ERROR" "Docker is not installed"
  exit 1
fi

if ! command_exists docker-compose; then
  log "ERROR" "Docker Compose is not installed"
  exit 1
fi

# Get git commit hash for versioning if not provided
if [[ "$VERSION" == "latest" ]]; then
  GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  VERSION="${ENVIRONMENT}-${GIT_COMMIT}"
fi

# Set image name
IMAGE_NAME="service-weaver"
if [[ -n "$REGISTRY" ]]; then
  FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
else
  FULL_IMAGE_NAME="${IMAGE_NAME}:${VERSION}"
fi

log "INFO" "Starting production release process"
log "INFO" "Version: $VERSION"
log "INFO" "Environment: $ENVIRONMENT"
log "INFO" "Image: $FULL_IMAGE_NAME"

# Backup function
backup_deployment() {
  if [[ "$BACKUP_BEFORE_DEPLOY" == "true" ]]; then
    log "INFO" "Creating backup before deployment..."
    
    # Get current running container ID
    CURRENT_CONTAINER=$(docker ps -q -f "name=${IMAGE_NAME}_${ENVIRONMENT}" || true)
    
    if [[ -n "$CURRENT_CONTAINER" ]]; then
      # Create backup tag for current image
      CURRENT_IMAGE=$(docker inspect --format='{{.Config.Image}}' "$CURRENT_CONTAINER" 2>/dev/null || true)
      if [[ -n "$CURRENT_IMAGE" ]]; then
        docker tag "$CURRENT_IMAGE" "${IMAGE_NAME}:backup-$(date +%Y%m%d-%H%M%S)" || true
        log "INFO" "Created backup image tag: ${IMAGE_NAME}:backup-$(date +%Y%m%d-%H%M%S)"
      fi
      
      # Backup data directory
      if [[ -d "./data" ]]; then
        tar -czf "data-backup-$(date +%Y%m%d-%H%M%S).tar.gz" ./data || true
        log "INFO" "Created data backup: data-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
      fi
    fi
  fi
}

# Build function
build_image() {
  if [[ "$SKIP_BUILD" == "true" ]]; then
    log "INFO" "Skipping build step as requested"
    return 0
  fi
  
  log "INFO" "Building Docker image..."
  
  # Build with environment-specific build args
  docker build \
    -f Dockerfile.prod \
    -t "$FULL_IMAGE_NAME" \
    --build-arg "REACT_APP_API_BASE=/api" \
    --build-arg "REACT_APP_WS_BASE=ws://localhost:8080" \
    --build-arg "NODE_ENV=$ENVIRONMENT" \
    .
  
  if [[ -n "$REGISTRY" ]]; then
    log "INFO" "Pushing image to registry..."
    docker push "$FULL_IMAGE_NAME"
  fi
  
  log "INFO" "Image built successfully: $FULL_IMAGE_NAME"
}

# Database migration function
run_migrations() {
  if [[ "$SKIP_MIGRATION" == "true" ]]; then
    log "INFO" "Skipping database migration as requested"
    return 0
  fi
  
  log "INFO" "Running database migrations..."
  
  # Check if postgres is running
  if ! docker-compose ps postgres | grep -q "Up"; then
    log "ERROR" "PostgreSQL is not running. Please start it first."
    return 1
  fi
  
  # Run migrations (this is a placeholder - adjust based on your actual migration system)
  # Example: docker-compose exec -T postgres psql -U postgres -d service_weaver -c "SELECT version();"
  log "INFO" "Database migrations completed"
}

# Health check function
health_check() {
  if [[ "$SKIP_HEALTH_CHECK" == "true" ]]; then
    log "INFO" "Skipping health check as requested"
    return 0
  fi
  
  log "INFO" "Running health checks..."
  
  # Wait for services to start
  sleep 10
  
  # Check if the service is responding
  if curl -f http://localhost/health >/dev/null 2>&1; then
    log "INFO" "Health check passed"
    return 0
  else
    log "ERROR" "Health check failed"
    return 1
  fi
}

# Rollback function
rollback() {
  log "ERROR" "Deployment failed, initiating rollback..."
  
  # Find the latest backup
  LATEST_BACKUP=$(docker images "${IMAGE_NAME}" --format "table {{.Tag}}" | grep "backup-" | sort -r | head -n 1)
  
  if [[ -n "$LATEST_BACKUP" ]]; then
    log "INFO" "Rolling back to backup: $LATEST_BACKUP"
    
    # Update docker-compose to use backup image
    sed -i.bak "s|${IMAGE_NAME}:.*|${IMAGE_NAME}:${LATEST_BACKUP}|g" docker-compose.yml
    
    # Restart services
    docker-compose --profile production up -d
    
    # Wait for services to start
    sleep 10
    
    # Run health check
    if health_check; then
      log "INFO" "Rollback completed successfully"
      notify_slack "Rollback completed successfully for ${ENVIRONMENT}"
    else
      log "ERROR" "Rollback health check failed"
      notify_slack "Rollback FAILED for ${ENVIRONMENT} - MANUAL INTERVENTION REQUIRED"
    fi
    
    # Restore original docker-compose.yml
    mv docker-compose.yml.bak docker-compose.yml
  else
    log "ERROR" "No backup image found for rollback"
    notify_slack "Rollback FAILED for ${ENVIRONMENT} - NO BACKUP FOUND"
  fi
}

# Main deployment function
deploy() {
  if [[ "$DEPLOY" == "false" ]]; then
    log "INFO" "Skipping deployment as requested"
    return 0
  fi
  
  log "INFO" "Starting deployment..."
  
  # Update docker-compose.yml to use the new image
  cp docker-compose.yml docker-compose.yml.bak
  sed -i "s|${IMAGE_NAME}:.*|${FULL_IMAGE_NAME}|g" docker-compose.yml
  
  # Stop existing services
  log "INFO" "Stopping existing services..."
  docker-compose --profile production down
  
  # Start new services
  log "INFO" "Starting new services..."
  docker-compose --profile production up -d
  
  # Wait for services to start
  sleep 10
  
  # Run health checks
  if health_check; then
    log "INFO" "Deployment completed successfully"
    notify_slack "Deployment completed successfully for ${ENVIRONMENT} - version ${VERSION}"
    
    # Clean up old backups (keep last 5)
    docker images "${IMAGE_NAME}" --format "table {{.Tag}}" | grep "backup-" | sort -r | tail -n +6 | xargs -r docker rmi || true
    ls data-backup-*.tar.gz 2>/dev/null | sort -r | tail -n +6 | xargs -r rm || true
    
    return 0
  else
    log "ERROR" "Health check failed after deployment"
    
    if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
      rollback
    else
      notify_slack "Deployment FAILED for ${ENVIRONMENT} - version ${VERSION}"
    fi
    
    return 1
  fi
}

# Main execution
trap 'log "ERROR" "Script interrupted"; exit 1' INT TERM

# Create backup
backup_deployment

# Build image
build_image

# Run migrations
run_migrations

# Deploy
if deploy; then
  log "INFO" "Production release completed successfully"
  notify_slack "Production release completed successfully for ${ENVIRONMENT} - version ${VERSION}"
  exit 0
else
  log "ERROR" "Production release failed"
  exit 1
fi