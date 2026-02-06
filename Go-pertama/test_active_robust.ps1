
$baseUrl = "http://localhost:8081"
$loginBody = Get-Content -Raw -Path "login.json"

Write-Host "1. Logging in..." -ForegroundColor Cyan
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful. Token: $token" -ForegroundColor Green
} catch {
    Write-Error "Login failed: $_"
    exit
}

Write-Host "`n2. Checking Active Users..." -ForegroundColor Cyan
try {
    $activeResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/active" -Method Get -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "Active Users Response:" -ForegroundColor Yellow
    $activeResponse.data | Format-Table Email, IsLoggedIn, LastLogin
} catch {
    Write-Error "Failed to get active users: $_"
    exit
}

Write-Host "`n3. Kicking User (self kick for test)..." -ForegroundColor Cyan
$kickBody = @{ email = "admin@example.com" } | ConvertTo-Json
try {
    $kickResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/kick" -Method Post -Body $kickBody -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "Kick Response: $($kickResponse.message)" -ForegroundColor Green
} catch {
    Write-Error "Kick failed: $_"
}

Write-Host "`n4. Verifying Session Invalidated..." -ForegroundColor Cyan
try {
    $checkResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/active" -Method Get -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "ERROR: Session should be invalid but request succeeded!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "Success: Session invalidated (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "Unexpected error: $_" -ForegroundColor Red
    }
}
