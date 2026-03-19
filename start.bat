@echo off
echo ============================================
echo   Bozor.uz Marketplace - Starting App
echo ============================================

echo.
echo [1/2] Starting Backend (port 5000)...
start "Backend - Bozor.uz" cmd /k "cd /d %~dp0backend && npm install && npm run dev"

echo.
echo [2/2] Waiting 3 seconds before starting Frontend...
timeout /t 3 /nobreak > nul

echo.
echo [2/2] Starting Frontend (port 5173)...
start "Frontend - Bozor.uz" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo ============================================
echo   Both servers starting in separate windows!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Press any key to open the app in browser...
pause > nul

start http://localhost:5173
