@echo off
REM Start both HTTPS and Backend servers for Resume Extractor

cd /d "C:\Users\Mann\Resume Extractor"

echo ============================================
echo Starting Resume Extractor Servers
echo ============================================
echo.
echo Starting HTTPS Server (https://127.0.0.1:8443)...
start "HTTPS Server" cmd /k "python https_server.py"

timeout /t 2 /nobreak

echo Starting Backend Server (http://127.0.0.1:8444)...
start "Backend Server" cmd /k "python backend_server.py"

echo.
echo ============================================
echo Both servers are starting...
echo.
echo HTTPS Server:    https://127.0.0.1:8443
echo Backend Server:  http://127.0.0.1:8444
echo.
echo Open your browser to https://127.0.0.1:8443
echo ============================================
