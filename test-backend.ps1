# Test if backend is running and CORS is configured
Write-Host "Testing Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "1. Checking if backend is running on port 8080..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Backend is running" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend is NOT running or not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "ACTION NEEDED:" -ForegroundColor Yellow
    Write-Host "1. Open terminal in backend directory" -ForegroundColor White
    Write-Host "2. Run: npm run dev" -ForegroundColor White
    Write-Host "3. Wait for: '🚀 Server running on port 8080'" -ForegroundColor White
    exit 1
}

Write-Host ""

# Test 2: Check CORS headers
Write-Host "2. Checking CORS headers..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5173"
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "Content-Type,Authorization"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" `
        -Method OPTIONS `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    
    if ($corsHeader -eq "http://localhost:5173") {
        Write-Host "   ✓ CORS is configured correctly!" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "   ✗ CORS header is wrong or missing" -ForegroundColor Red
        Write-Host "   Expected: http://localhost:5173" -ForegroundColor Yellow
        Write-Host "   Got: $corsHeader" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "ACTION NEEDED: Restart backend server!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Could not check CORS" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "If CORS is not configured:" -ForegroundColor Yellow
Write-Host "1. Stop backend (Ctrl+C)" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Look for: 'CORS enabled for origin'" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

