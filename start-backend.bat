@echo off
echo ====================================
echo    ИС "Библиотека" — Backend
echo ====================================

:: Освобождаем порт 3001 если занят
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Останавливаем процесс PID %%a на порту 3001...
    taskkill /PID %%a /F >nul 2>&1
)

echo Запуск сервера на http://localhost:3001
echo.

cd /d "%~dp0backend"
node server.js

pause
