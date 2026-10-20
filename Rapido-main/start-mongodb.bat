@echo off
title MongoDB Server (127.0.0.1:27017)
echo ========================================================
echo       RidePass Pro — Starting MongoDB Server
echo ========================================================
echo Database Storage Path: C:\data\db
echo Port: 27017
echo.

if not exist "C:\data\db" (
    echo Creating C:\data\db directory...
    mkdir "C:\data\db"
)

"C:\Users\devas\Downloads\mongodb-windows-x86_64-8.3.8\mongodb-win32-x86_64-windows-8.3.8\bin\mongod.exe" --dbpath "C:\data\db"

pause
