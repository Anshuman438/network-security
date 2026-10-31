@echo off
title Spectre SOC Launcher
echo ========================================================
echo               SPECTRE - Cyber Defense SOC
echo               Starting Local Services (No Docker)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "Spectre Backend" /d "%ROOT_DIR%backend" cmd /k ".\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/3] Starting Vite React Frontend on http://localhost:5173 ...
start "Spectre Frontend" /d "%ROOT_DIR%frontend" cmd /k "npm run dev"

echo [3/3] Opening Spectre SOC in your browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo   Spectre is now running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   Docs     : http://localhost:8000/api/docs
echo.
echo   Login Credentials:
echo   Username : admin
echo   Password : AdminPass123!
echo ========================================================
echo.
pause
