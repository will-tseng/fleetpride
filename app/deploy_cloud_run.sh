#!/bin/bash
#
# Google Cloud Run Deployment Script for SE Tools App
#
# USAGE:
#   ./deploy_cloud_run.sh
#   USE_SECRET_MANAGER=true ./deploy_cloud_run.sh

set -euo pipefail

USE_SECRET_MANAGER=${USE_SECRET_MANAGER:-false}
SECRET_NAME_PREFIX=${SECRET_NAME_PREFIX:-"se-demos-b2b-home-goods"}
PROJECT_ID=${PROJECT_ID:-"lw-sales"}
REPOSITORY=${REPOSITORY:-"se-demos-b2b-home-goods"}
REGION=${REGION:-"us-central1"}
IMAGE_NAME=${IMAGE_NAME:-"board-demo-feb-2026"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

AR_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}"

handle_error() {
    echo "❌ Error: Deployment failed at step: $1" >&2
    exit 1
}

log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

create_secrets() {
    log_info "Secret creation function available for future use..."
    log_info "Currently no secrets are needed as the app only uses REACT_APP_API_BASE_URL"
    # Add secret creation logic here if sensitive environment variables are added in the future
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
        echo "❌ You need to authenticate with Google Cloud first." >&2
        echo "Run: gcloud auth login" >&2
        exit 1
    fi
    log_success "gcloud authentication verified"

    if ! command -v docker &>/dev/null; then
        handle_error "Docker is not installed or not in PATH"
    fi
    log_success "Docker available"
}

setup_artifact_registry() {
    log_info "Setting up Artifact Registry..."

    if gcloud artifacts repositories describe "$REPOSITORY" \
        --project="$PROJECT_ID" \
        --location="$REGION" >/dev/null 2>&1; then
        log_success "Artifact Registry repository '$REPOSITORY' already exists"
    else
        log_info "Creating Artifact Registry repository..."
        gcloud artifacts repositories create "$REPOSITORY" \
            --repository-format=docker \
            --location="$REGION" \
            --project="$PROJECT_ID" \
            --description="Docker repository for SE Tools" || \
            handle_error "Failed to create Artifact Registry repository"
        log_success "Created Artifact Registry repository: $REPOSITORY"
    fi
}

build_and_push_image() {
    log_info "Building Docker image..."
    docker build -t "${AR_PATH}:${IMAGE_TAG}" . || handle_error "Docker build failed"
    log_success "Docker image built successfully"

    log_info "Configuring Docker authentication..."
    gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet || handle_error "Docker auth configuration failed"

    log_info "Pushing Docker image..."
    docker push "${AR_PATH}:${IMAGE_TAG}" || handle_error "Docker push failed"
    log_success "Docker image pushed successfully"
}

load_environment() {
    if [[ -f .env ]]; then
        log_info "Loading environment variables from .env file..."
        set -a
        source .env
        set +a
        log_success "Environment variables loaded"
    else
        log_info "Warning: No .env file found. Using default values."
    fi
}
deploy_to_cloud_run() {
    log_info "Deploying to Google Cloud Run..."

    local default_env_vars=(
        "REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-https://se-demos-tools.lucidworkssales.com/}"
    )

    local deploy_cmd=(
        gcloud run deploy "$IMAGE_NAME"
        --image "${AR_PATH}:${IMAGE_TAG}"
        --platform managed
        --region "$REGION"
        --allow-unauthenticated
        --port 80
        --cpu 1
        --memory 512Mi
        --project "$PROJECT_ID"
    )

    for env_var in "${default_env_vars[@]}"; do
        deploy_cmd+=(--set-env-vars "$env_var")
    done

    if [[ "$USE_SECRET_MANAGER" == "true" ]]; then
        log_info "Secret Manager support is configured but no secrets are currently needed."
        log_info "Add secrets to the create_secrets() function if needed in the future."
    fi

    "${deploy_cmd[@]}" || handle_error "Cloud Run deployment failed"
    log_success "Deployment completed successfully"
}

get_service_url() {
    local service_url
    service_url=$(gcloud run services describe "$IMAGE_NAME" \
        --platform managed \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --format 'value(status.url)' 2>/dev/null) || handle_error "Failed to get service URL"
    
    echo "$service_url"
}

main() {
    log_info "Starting Google Cloud Run deployment..."
    
    check_prerequisites
    load_environment
    setup_artifact_registry
    build_and_push_image
    
    if [[ "$USE_SECRET_MANAGER" == "true" ]]; then
        create_secrets
    fi
    
    deploy_to_cloud_run
    
    local service_url
    service_url=$(get_service_url)
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "📱 Your application is now accessible at: $service_url"
    echo "🏷️  Image: ${AR_PATH}:${IMAGE_TAG}"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi