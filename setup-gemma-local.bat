@echo off
echo ========================================
echo  Samiati + Gemma Local Setup Script
echo ========================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Ollama is not installed!
    echo.
    echo Please download and install Ollama from:
    echo https://ollama.com/download/windows
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo [1/4] Installing Ollama... DONE
echo.
echo [2/4] Downloading Gemma 4B model...
echo This may take a few minutes depending on your internet speed...
echo.

REM Download Gemma 4B model
ollama pull gemma4b

if %ERRORLEVEL% NEQ 0 (
    echo WARNING: gemma4b model not found. Trying alternative name...
    ollama pull gemma
)

echo.
echo [3/4] Starting Ollama server...
echo.

REM Start Ollama in background
start /b ollama serve

echo Server starting on http://localhost:11434
echo.

echo [4/4] Testing connection...
timeout /t 5 /nobreak >nul

curl -s http://localhost:11434/api/tags >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! 
    echo ========================================
    echo.
    echo Ollama is running with Gemma!
    echo.
    echo To connect Samiati web app:
    echo 1. Set environment variable: OLLAMA_URL=http://localhost:11434
    echo 2. Or use ngrok: ngrok http 11434
    echo.
) else (
    echo.
    echo WARNING: Could not connect to Ollama.
    echo Make sure Ollama is running and try again.
)

echo.
pause