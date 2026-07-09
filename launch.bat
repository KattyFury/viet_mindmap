@echo off
setlocal
cd /d "%~dp0"

set PORT=3000
set URL=http://localhost:%PORT%
set CHROME=

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

:: Da co server dang chay?
curl -s -o NUL --connect-timeout 1 %URL% 2>NUL
if %ERRORLEVEL%==0 goto OPEN

echo [VietMindmap] Dang khoi dong dev server...
start "VietMindmap" /MIN cmd /c "npm run dev"

:: Cho server san sang (toi da ~60s)
set /a n=0
:WAIT
set /a n+=1
if %n% GTR 60 (
  echo [VietMindmap] Timeout - mo trinh duyet thu cong: %URL%
  goto OPEN
)
timeout /t 1 /nobreak >NUL
curl -s -o NUL --connect-timeout 1 %URL% 2>NUL
if %ERRORLEVEL% NEQ 0 goto WAIT

:OPEN
if defined CHROME (
  :: --app = cua so giong app/bookmark, khong thanh dia chi
  start "" "%CHROME%" --new-window --app=%URL%
) else (
  start "" %URL%
)

endlocal
