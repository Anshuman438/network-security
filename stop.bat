@echo off
title Stop Spectre SOC
color 0C
echo ======================================================================
echo                      SPECTRE - STOPPING SERVICES
echo ======================================================================
echo.

echo [*] Stopping backend processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":8000\>"') do taskkill /f /pid %%a >nul 2>&1

echo [*] Stopping frontend processes on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":5173\>"') do taskkill /f /pid %%a >nul 2>&1

echo [*] All Spectre services stopped.
echo ======================================================================
echo.
ping -n 3 127.0.0.1 >nul
