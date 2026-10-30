@echo off
title Stop Spectre SOC
echo ========================================================
echo               SPECTRE - Stopping Local Services
echo ========================================================
echo.

echo Stopping uvicorn and python backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a 2>nul

echo Stopping vite frontend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a 2>nul

echo.
echo All Spectre services stopped.
echo ========================================================
timeout /t 2 /nobreak >nul
