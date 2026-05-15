@echo off
echo [LCH] Installing latest VSIX...
cd /d "%~dp0.."
for /f "delims=" %%f in ('dir /b /o-d *.vsix 2^>nul') do (
    set VSIX=%%f
    goto :found
)
echo No .vsix found. Run scripts\package.bat first.
exit /b 1

:found
echo Installing %VSIX%...
code --install-extension "%VSIX%"
echo [LCH] Done. Reload VS Code to apply.
