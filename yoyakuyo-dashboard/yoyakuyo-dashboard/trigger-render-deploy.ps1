# PowerShell script to trigger Render deployment
# This requires a Render API key

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceId,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = $env:RENDER_API_KEY
)

if ([string]::IsNullOrEmpty($ApiKey)) {
    Write-Host "❌ RENDER_API_KEY not found in environment variables" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your API key:" -ForegroundColor Yellow
    Write-Host "1. Go to https://dashboard.render.com/account/api-keys"
    Write-Host "2. Create a new API key"
    Write-Host "3. Run: `$env:RENDER_API_KEY='your-key-here'"
    Write-Host ""
    Write-Host "To get your Service ID:" -ForegroundColor Yellow
    Write-Host "1. Go to https://dashboard.render.com"
    Write-Host "2. Click on 'yoyaku-yo-api' service"
    Write-Host "3. The Service ID is in the URL: /web/[SERVICE_ID]"
    exit 1
}

Write-Host "🚀 Triggering Render deployment..." -ForegroundColor Cyan
Write-Host "Service ID: $ServiceId" -ForegroundColor Gray

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Accept" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/deploys" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✅ Deployment triggered successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployment ID: $($response.deploy.id)" -ForegroundColor Cyan
    Write-Host "Status: $($response.deploy.status)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Monitor deployment at:" -ForegroundColor Yellow
    Write-Host "https://dashboard.render.com/web/$ServiceId" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to trigger deployment" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

