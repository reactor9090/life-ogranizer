@echo off
cd /d "%~dp0"
title Life Organizer
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nu este instalat. Descarca-l de pe https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalez dependentele - doar prima data...
  call npm install
)
echo Pornesc aplicatia la http://localhost:5173 - inchide fereastra pentru a opri.
call npx vite --open
