@echo off
echo [LCH] Building extension...
cd /d "%~dp0.."
npm run compile
echo [LCH] Done.
