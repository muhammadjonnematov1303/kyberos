@echo off
echo ========================================
echo   KYBERS.OS - Quick Start
echo ========================================
echo.

REM Check if node_modules exists
if not exist "backend\node_modules" (
    echo [1/3] Installing dependencies...
    cd backend
    call npm install
    cd ..
    echo.
) else (
    echo [1/3] Dependencies already installed
    echo.
)

REM Start server
echo [2/3] Starting server...
cd backend
start "KYBERS.OS Server" cmd /k "npm start"
cd ..
echo.

REM Wait a bit for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo [3/3] Opening browser...
start http://localhost:5000
echo.

echo ========================================
echo   Server running on http://localhost:5000
echo   Press Ctrl+C in server window to stop
echo ========================================
pause
