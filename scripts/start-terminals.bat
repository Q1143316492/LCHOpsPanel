@echo off
REM 启动多个终端的批处理文件
echo 正在启动多个终端...

REM 设置终端名称列表
set terminals=gas1 gas2 gcc1 gcc2 gds

REM 逐个启动终端
for %%t in (%terminals%) do (
    echo 启动终端: %%t
    start "%%t" cmd /k "echo Terminal: %%t started && echo Working Directory: %CD% && echo Press Ctrl+C to exit"
    timeout /t 1 /nobreak >nul
)

echo 所有终端已启动完成!
echo 终端列表: %terminals%
pause
