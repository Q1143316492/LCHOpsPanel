@echo off
echo [LCH] Packaging extension...
cd /d "%~dp0.."
npm run package
echo [LCH] Package complete. VSIX:
dir /b *.vsix 2>nul
echo [LCH] Done.
