@echo off
cd /d "%~dp0\.."
echo Building VSIX...
call npx vsce package --no-dependencies
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Done. VSIX file created in project root.
pause
