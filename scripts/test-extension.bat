@echo off
echo ========================================
echo    LCH Ops Panel - 完整测试流程
echo ========================================
echo.

:menu
echo 请选择测试方式：
echo [1] 快速开发测试 (F5方式)
echo [2] 完整打包测试 (VSIX安装)
echo [3] 卸载现有扩展
echo [4] 查看扩展状态
echo [0] 退出
echo.
set /p choice="请输入选择 (0-4): "

if "%choice%"=="1" goto dev_test
if "%choice%"=="2" goto package_test
if "%choice%"=="3" goto uninstall
if "%choice%"=="4" goto status
if "%choice%"=="0" goto end
goto menu

:dev_test
echo.
echo 🚀 方法1: 开发测试
echo ===============================
echo 1. 编译扩展...
call npm run compile
if errorlevel 1 (
    echo ❌ 编译失败！请检查错误信息。
    pause
    goto menu
)
echo ✅ 编译成功！
echo.
echo 2. 下一步操作：
echo    - 按 F5 启动扩展开发主机
echo    - 或者在VS Code中运行 "Run Extension" 调试配置
echo    - 新窗口中测试你的扩展功能
echo.
pause
goto menu

:package_test
echo.
echo 📦 方法2: 完整打包测试
echo ===============================
echo 1. 创建VSIX包...
call vsce package
if errorlevel 1 (
    echo ❌ 打包失败！请检查错误信息。
    pause
    goto menu
)
echo ✅ 打包成功！
echo.
echo 2. 查找生成的VSIX文件...
for /f "tokens=*" %%f in ('dir /b *.vsix 2^>nul ^| sort /r') do (
    echo    找到最新: %%f
    set "vsix_file=%%f"
    goto :found_vsix
)
:found_vsix
echo.
echo 3. 安装扩展...
if defined vsix_file (
    code --install-extension "%vsix_file%"
    if errorlevel 1 (
        echo ❌ 安装失败！
        echo 💡 你也可以手动安装：
        echo    - 打开VS Code
        echo    - Extensions ^> ... ^> Install from VSIX
        echo    - 选择 %vsix_file%
    ) else (
        echo ✅ 扩展安装成功！
        echo 📍 请重启VS Code生效
    )
) else (
    echo ❌ 未找到VSIX文件
)
echo.
pause
goto menu

:uninstall
echo.
echo 🗑️  卸载现有扩展
echo ===============================
echo 卸载LCH Ops Panel扩展...
code --uninstall-extension Weylochen.lch-ops-panel
echo ✅ 卸载完成！
echo 📍 请重启VS Code生效
echo.
pause
goto menu

:status
echo.
echo 📊 扩展状态检查
echo ===============================
echo 检查已安装的扩展...
code --list-extensions | findstr "lch-ops-panel"
if errorlevel 1 (
    echo ❌ LCH Ops Panel 未安装
) else (
    echo ✅ LCH Ops Panel 已安装
)
echo.
echo 检查项目文件...
if exist "dist\extension.js" (
    echo ✅ dist\extension.js 存在
) else (
    echo ❌ dist\extension.js 不存在 - 需要编译
)
if exist "*.vsix" (
    echo ✅ VSIX包存在:
    dir *.vsix /b
) else (
    echo ❌ VSIX包不存在 - 需要打包
)
echo.
pause
goto menu

:end
echo 测试结束！
exit /b 0
