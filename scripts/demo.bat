@echo off
REM 演示脚本 - 启动终端并测试平铺功能
echo ================================
echo   多终端管理演示脚本
echo ================================

echo.
echo 第一步: 启动多个命名终端...
echo.

REM 启动几个测试终端
start "gas1-demo" cmd /k "echo Gas Terminal 1 - Ready for monitoring && echo Type 'exit' to close"
timeout /t 2 /nobreak >nul

start "gas2-demo" cmd /k "echo Gas Terminal 2 - Ready for monitoring && echo Type 'exit' to close"  
timeout /t 2 /nobreak >nul

start "gcc1-demo" cmd /k "echo GCC Terminal 1 - Compiler ready && echo Type 'exit' to close"
timeout /t 2 /nobreak >nul

echo 已启动3个演示终端: gas1-demo, gas2-demo, gcc1-demo
echo.

echo 第二步: 等待5秒后自动尝试平铺gas相关终端...
timeout /t 5 /nobreak

echo.
echo 执行Python平铺脚本...
python terminal_tiler.py gas-demo

echo.
echo ================================
echo 演示完成! 
echo 你现在可以看到:
echo 1. 三个命名的终端窗口
echo 2. gas相关的终端已被平铺
echo 3. 可以手动执行更多测试命令
echo ================================
echo.
echo 额外测试命令:
echo   python terminal_tiler.py --list     ^(列出所有终端^)
echo   python terminal_tiler.py gcc-demo   ^(平铺gcc终端^)
echo   python terminal_tiler.py gas-demo --horizontal  ^(水平平铺^)
echo.
pause
