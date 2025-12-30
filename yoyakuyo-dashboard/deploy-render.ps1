# PowerShell script to trigger Render deployment via API
# Usage: .\deploy-render.ps1 [SERVICE_ID] [API_KEY]

param(
    [string]$ServiceId = "",
    [string]$ApiKey = $env:RENDER_API_KEY
)

if ([string]::IsNullOrEmpty($ServiceId) -or [string]::IsNullOrEmpty($ApiKey)) {
    Write-Host "Usage: .\deploy-render.ps1 -ServiceId <SERVICE_ID> [-ApiKey <API_KEY>]"
    Write-Host "Or set RENDER_API_KEY environment variable"
    Write-Host ""
    Write-Host "To get SERVICE_ID:"
    Write-Host "1. Go to https://dashboard.render.com"
    Write-Host "2. Click on your service (yoyaku-yo-api)"
    Write-Host "3. The SERVICE_ID is in the URL: https://dashboard.render.com/web/[SERVICE_ID]"
    Write-Host ""
    Write-Host "To get API_KEY:"
    Write-Host "1. Go to https://dashboard.render.com/account/api-keys"
    Write-Host "2. Create a new API key"
    exit 1
}

Write-Host "🚀 Triggering Render deployment for service: $ServiceId"

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/deploys" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✅ Deployment triggered successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "Check deployment status at: https://dashboard.render.com/web/$ServiceId" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to trigger deployment" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
    exit 1
}

