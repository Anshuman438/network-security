@echo off
setlocal enabledelayedexpansion
title Spectre SOC Launcher
color 0B

echo ======================================================================
echo                      SPECTRE - CYBER DEFENSE SOC
echo ======================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 1. Verify Backend Python Environment
if not exist "%SCRIPT_DIR%backend\.venv\Scripts\python.exe" (
    echo [!] Python virtual environment not found in backend\.venv.
    echo [*] Initializing virtual environment...
    python -m venv "%SCRIPT_DIR%backend\.venv"
    call "%SCRIPT_DIR%backend\.venv\Scripts\activate.bat"
    pip install -r "%SCRIPT_DIR%backend\requirements.txt"
)

:: 2. Clear any lingering port conflicts from previous runs
echo [*] Checking and freeing ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":8000\>"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":5173\>"') do taskkill /f /pid %%a >nul 2>&1

:: 3. Start Backend
echo [*] Starting FastAPI Backend on http://localhost:8000 ...
start "[Spectre] Backend API" /d "%SCRIPT_DIR%backend" cmd /k ".\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: Wait 3 seconds using ping (safe across all Windows environments, no input redirection errors)
ping -n 4 127.0.0.1 >nul

:: 4. Start Frontend
echo [*] Starting Vite React Frontend on http://localhost:5173 ...
start "[Spectre] Frontend UI" /d "%SCRIPT_DIR%frontend" cmd /k "npm run dev"

:: Wait 4 seconds for Vite dev server
ping -n 5 127.0.0.1 >nul

:: 5. Open Browser
echo [*] Opening Spectre SOC in your browser...
start http://localhost:5173

echo.
echo ======================================================================
echo   Spectre SOC is now running!
echo.
echo   UI Dashboard : http://localhost:5173
echo   API Docs     : http://localhost:8000/api/docs
echo.
echo   Default Credentials:
echo     Username   : admin
echo     Password   : AdminPass123!
echo.
echo   (To stop Spectre at any time, run stop.bat or close the windows)
echo ======================================================================
echo.
pause
