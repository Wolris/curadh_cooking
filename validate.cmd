@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\invoke-validation.ps1" %*
set "VALIDATION_EXIT=%ERRORLEVEL%"
echo.
echo Validation command results:
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\report-validation-steps.ps1" "%~dp0validation-logs\latest.txt"
exit /b %VALIDATION_EXIT%
