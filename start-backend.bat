@echo off
title RidePass Pro Backend Server (Port 4000)
echo ========================================================
echo       RidePass Pro — Starting Backend Server
echo ========================================================
echo.

cd /d "%~dp0"

REM Check if outer or inner folder
if exist "Rapido-main\backend\server.js" (
    cd Rapido-main\backend
)

echo Starting Node.js Express Server...
node server.js
pause
