$response = @{
    email = "test@example.com"
    password = "password"
}

$json = $response | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

$uri = "http://localhost:8000/api/auth/login"

try {
    $result = Invoke-WebRequest -Uri $uri `
        -Method POST `
        -Headers $headers `
        -Body $json `
        -UseBasicParsing
    
    Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $result.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Content:" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.ReadToEnd()
        $reader.Close()
    }
}
