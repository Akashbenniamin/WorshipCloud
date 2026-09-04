@echo off
title Sathiyavedam Ortho Web Reader
echo Starting local web server...
cd /d "%~dp0"
call pnpm dev --open
pause
