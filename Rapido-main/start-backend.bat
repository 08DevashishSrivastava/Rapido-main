@echo off
title RidePass Pro Backend Server (Port 4000)
echo ========================================================
echo       RidePass Pro — Starting Backend Server
echo ========================================================
echo.

cd /d "%~dp0"

if exist "backend\server.js" (
    cd backend
)

echo Starting Node.js Express Server...
node server.js
pause
