# 启动多个命名终端的PowerShell脚本
# 模拟Windows下运行多进程终端的场景

param(
    [string[]]$TerminalNames = @("gas1", "gas2", "gcc1", "gcc2", "gds"),
    [string]$WorkingDirectory = (Get-Location).Path
)

Write-Host "正在启动多个终端..." -ForegroundColor Green
Write-Host "工作目录: $WorkingDirectory" -ForegroundColor Yellow

foreach ($terminalName in $TerminalNames) {
    Write-Host "启动终端: $terminalName" -ForegroundColor Cyan
    
    # 使用Windows Terminal启动新的终端标签页（如果安装了Windows Terminal）
    if (Get-Command "wt" -ErrorAction SilentlyContinue) {
        Start-Process "wt" -ArgumentList "-w", "0", "new-tab", "--title", $terminalName, "powershell.exe", "-NoExit", "-Command", "cd '$WorkingDirectory'; Write-Host 'Terminal: $terminalName started' -ForegroundColor Green; Write-Host 'Working Directory: $(Get-Location)' -ForegroundColor Yellow"
    }
    # 如果没有Windows Terminal，使用传统的PowerShell窗口
    else {
        $command = "cd '$WorkingDirectory'; `$Host.UI.RawUI.WindowTitle = '$terminalName'; Write-Host 'Terminal: $terminalName started' -ForegroundColor Green; Write-Host 'Working Directory: `$(Get-Location)' -ForegroundColor Yellow; Write-Host 'Press Ctrl+C to exit' -ForegroundColor Red"
        Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", $command
    }
    
    # 短暂延迟避免同时启动过多窗口
    Start-Sleep -Milliseconds 500
}

Write-Host "所有终端已启动完成!" -ForegroundColor Green
Write-Host "终端列表: $($TerminalNames -join ', ')" -ForegroundColor Yellow

# 脚本本身不退出，保持运行状态
Write-Host "脚本保持运行状态，按任意键退出..." -ForegroundColor Magenta
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
