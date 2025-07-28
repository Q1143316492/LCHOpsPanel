# 多终端管理脚本使用说明

本目录包含了用于管理多个终端窗口的脚本集合，专为Windows环境设计。

## 脚本文件说明

### 1. 终端启动脚本

#### `start-multiple-terminals.ps1` (推荐)
PowerShell脚本，支持传统终端和Windows Terminal。
```powershell
# 使用默认终端名称启动
.\start-multiple-terminals.ps1

# 自定义终端名称
.\start-multiple-terminals.ps1 -TerminalNames @("server1", "server2", "client1")

# 指定工作目录
.\start-multiple-terminals.ps1 -WorkingDirectory "C:\MyProject"
```

#### `start-terminals-wt.ps1`
专门针对Windows Terminal优化的版本。
```powershell
# 启动Windows Terminal多标签页
.\start-terminals-wt.ps1

# 自定义配置
.\start-terminals-wt.ps1 -TerminalNames @("gas1", "gas2") -ShellProfile "PowerShell"
```

#### `start-terminals.bat`
传统批处理文件，兼容性最好。
```cmd
start-terminals.bat
```

### 2. 终端平铺管理器

#### `terminal_tiler.py` (主要功能)
Python脚本，用于搜索和平铺终端窗口。

**安装依赖:**
```bash
python install_dependencies.py
```

**基本使用:**
```bash
# 垂直平铺所有包含'gas'的终端
python terminal_tiler.py gas

# 水平平铺所有包含'gcc'的终端  
python terminal_tiler.py gcc --horizontal

# 列出所有终端窗口
python terminal_tiler.py --list

# 自定义窗口间距
python terminal_tiler.py gas --gap 10
```

## 使用场景

### 场景1: 启动多进程开发环境
```powershell
# 启动多个命名终端
.\start-multiple-terminals.ps1 -TerminalNames @("gas1", "gas2", "gcc1", "gcc2", "gds")
```

### 场景2: 查看特定类型的日志
```bash
# 平铺所有gas相关终端，方便同时查看日志
python terminal_tiler.py gas

# 水平平铺gcc相关终端
python terminal_tiler.py gcc --horizontal
```

### 场景3: VS Code扩展集成
这些脚本可以集成到LCHOpsPanel扩展中，通过配置文件快速执行：

```json
{
  "scripts": [
    {
      "name": "启动开发环境",
      "command": "powershell -ExecutionPolicy Bypass -File ./scripts/start-multiple-terminals.ps1",
      "category": "终端管理"
    },
    {
      "name": "平铺gas终端",
      "command": "python ./scripts/terminal_tiler.py gas",
      "category": "终端管理"
    }
  ]
}
```

## 技术特性

### PowerShell脚本特性:
- ✅ 支持Windows Terminal和传统终端
- ✅ 自定义终端名称和工作目录
- ✅ 脚本保持运行状态，不主动退出
- ✅ 彩色输出，用户友好

### Python平铺器特性:
- ✅ 智能终端窗口识别
- ✅ 支持垂直和水平平铺
- ✅ 可配置窗口间距
- ✅ 跨终端类型支持(CMD, PowerShell, Windows Terminal)
- ✅ 错误处理和日志输出

## 故障排除

### 常见问题:

1. **PowerShell执行策略限制**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Python依赖缺失**
   ```bash
   python install_dependencies.py
   ```

3. **Windows Terminal未安装**
   - 使用 `start-multiple-terminals.ps1` 代替
   - 或从Microsoft Store安装Windows Terminal

4. **终端窗口识别失败**
   - 使用 `python terminal_tiler.py --list` 查看可用窗口
   - 检查终端标题是否包含关键字

## 扩展开发

这些脚本为LCHOpsPanel扩展提供了基础功能，可以通过以下方式进一步集成:

1. **配置管理**: 将脚本路径和参数保存在工作区配置中
2. **右键菜单**: 添加"平铺相关终端"上下文菜单
3. **状态监控**: 实时监控终端状态和数量
4. **自动化**: 根据项目类型自动启动相应的终端组合
