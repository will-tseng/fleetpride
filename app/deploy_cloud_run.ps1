# Google Cloud Run Deployment Script for Windows PowerShell
#
# USAGE:
#   .\deploy_cloud_run.ps1
#
# To use a different image name:
#   $env:IMAGE_NAME = "my-custom-name"; .\deploy_cloud_run.ps1

param(
    [string]$ProjectId = "lw-sales",
    [string]$Repository = "se-demos-b2b-home-goods",
    [string]$Region = "us-central1",
    [string]$ImageName = "board-demo-feb-2026",
    [string]$ImageTag = "latest"
)

# Allow environment variable overrides
if ($env:PROJECT_ID) { $ProjectId = $env:PROJECT_ID }
if ($env:REPOSITORY) { $Repository = $env:REPOSITORY }
if ($env:REGION) { $Region = $env:REGION }
if ($env:IMAGE_NAME) { $ImageName = $env:IMAGE_NAME }
if ($env:IMAGE_TAG) { $ImageTag = $env:IMAGE_TAG }

$ArPath = "$Region-docker.pkg.dev/$ProjectId/$Repository/$ImageName"

function Write-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

# Main deployment process
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  Google Cloud Run Deployment Script" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "Configuration:"
Write-Host "  Project ID:  $ProjectId"
Write-Host "  Repository:  $Repository"
Write-Host "  Region:      $Region"
Write-Host "  Image Name:  $ImageName"
Write-Host "  Image Tag:   $ImageTag"
Write-Host "  Full Path:   ${ArPath}:${ImageTag}"

# Step 1: Check gcloud authentication
Write-Step "Step 1/5: Checking gcloud authentication..."
$authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authCheck) {
    Write-Error "You need to authenticate with Google Cloud first."
    Write-Host "Run: gcloud auth login"
    exit 1
}
Write-Success "Authenticated as: $authCheck"

# Step 2: Check Docker
Write-Step "Step 2/5: Checking Docker..."
$dockerCheck = docker info 2>$null
if (-not $?) {
    Write-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}
Write-Success "Docker is running"

# Step 3: Build Docker image
Write-Step "Step 3/5: Building Docker image..."
docker build -t "${ArPath}:${ImageTag}" .
if (-not $?) {
    Write-Error "Docker build failed"
    exit 1
}
Write-Success "Docker image built successfully"

# Step 4: Configure Docker auth and push
Write-Step "Step 4/5: Pushing Docker image to Artifact Registry..."
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet
if (-not $?) {
    Write-Error "Docker auth configuration failed"
    exit 1
}

docker push "${ArPath}:${ImageTag}"
if (-not $?) {
    Write-Error "Docker push failed"
    exit 1
}
Write-Success "Docker image pushed successfully"

# Step 5: Deploy to Cloud Run
Write-Step "Step 5/5: Deploying to Cloud Run..."
gcloud run deploy $ImageName `
    --image "${ArPath}:${ImageTag}" `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --port 80 `
    --cpu 1 `
    --memory 512Mi `
    --project $ProjectId `
    --set-env-vars "REACT_APP_API_BASE_URL=https://se-demos-tools.lucidworkssales.com/"

if (-not $?) {
    Write-Error "Cloud Run deployment failed"
    exit 1
}

# Get service URL
$ServiceUrl = gcloud run services describe $ImageName `
    --platform managed `
    --region $Region `
    --project $ProjectId `
    --format "value(status.url)" 2>$null

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nYour application is now accessible at:"
Write-Host "  $ServiceUrl" -ForegroundColor Yellow
Write-Host "`nImage: ${ArPath}:${ImageTag}"
