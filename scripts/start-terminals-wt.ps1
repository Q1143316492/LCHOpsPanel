# Windows Terminal版本的多终端启动脚本
# 需要安装Windows Terminal

param(
    [string[]]$TerminalNames = @("gas1", "gas2", "gcc1", "gcc2", "gds"),
    [string]$WorkingDirectory = (Get-Location).Path,
    [string]$ShellProfile = "PowerShell"
)

# 检查Windows Terminal是否可用
if (-not (Get-Command "wt" -ErrorAction SilentlyContinue)) {
    Write-Error "Windows Terminal 未安装。请使用 start-multiple-terminals.ps1 或安装 Windows Terminal。"
    exit 1
}

Write-Host "使用Windows Terminal启动多个终端..." -ForegroundColor Green
Write-Host "工作目录: $WorkingDirectory" -ForegroundColor Yellow

# 构建Windows Terminal命令
$wtCommand = @("new-tab", "--title", $TerminalNames[0], "--profile", $ShellProfile, "--startingDirectory", $WorkingDirectory, "powershell.exe", "-NoExit", "-Command", "Write-Host 'Terminal: $($TerminalNames[0]) started' -ForegroundColor Green")

# 添加其他标签页
for ($i = 1; $i -lt $TerminalNames.Count; $i++) {
    $terminalName = $TerminalNames[$i]
    $wtCommand += ";"
    $wtCommand += "new-tab"
    $wtCommand += "--title"
    $wtCommand += $terminalName
    $wtCommand += "--profile"
    $wtCommand += $ShellProfile
    $wtCommand += "--startingDirectory"
    $wtCommand += $WorkingDirectory
    $wtCommand += "powershell.exe"
    $wtCommand += "-NoExit"
    $wtCommand += "-Command"
    $wtCommand += "Write-Host 'Terminal: $terminalName started' -ForegroundColor Green"
}

Write-Host "启动命令: wt $($wtCommand -join ' ')" -ForegroundColor Cyan
Start-Process "wt" -ArgumentList $wtCommand

Write-Host "所有终端标签页已在Windows Terminal中创建!" -ForegroundColor Green
Write-Host "终端列表: $($TerminalNames -join ', ')" -ForegroundColor Yellow

# 脚本保持运行状态
Write-Host "脚本保持运行状态，按任意键退出..." -ForegroundColor Magenta
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
