$token = "sql-jwt-token-admin@example.com-secret-default"
$headers = @{ Authorization = "Bearer $token" }
Write-Host "--- Active Users ---"
$response = Invoke-RestMethod -Uri "http://localhost:8081/api/users/active" -Method Get -Headers $headers
$response.data | Format-Table Email, IsLoggedIn, RoleID

Write-Host "`n--- Kicking User ---"
$kickBody = @{ email = "admin@example.com" } | ConvertTo-Json
try {
    $kickResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/users/kick" -Method Post -Headers $headers -Body $kickBody -ContentType "application/json"
    Write-Host "Kick Response: $($kickResponse.message)"
} catch {
    Write-Host "Kick Error: $_"
}

Write-Host "`n--- Verify Session Invalidated ---"
try {
    Invoke-RestMethod -Uri "http://localhost:8081/api/users/active" -Method Get -Headers $headers
    Write-Host "ERROR: Session still valid!"
} catch {
    Write-Host "SUCCESS: Session invalidated (Expected 401)"
    Write-Host $_.Exception.Response.StatusCode
}
