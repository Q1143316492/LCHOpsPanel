# 存储机制说明

## 🎮 2048游戏数据存储

### 📍 存储位置
最高分存储在 **VS Code的GlobalState** 中：
- **键名**: `lchOpsPanel.game2048.bestScore`
- **值**: 数字类型（最高分）
- **持久化**: 自动同步到磁盘

### 💾 实际文件位置

**Windows**:
```
%APPDATA%\Code\User\globalStorage\Weylochen.lch-ops-panel\
```

**macOS**:
```
~/Library/Application Support/Code/User/globalStorage/Weylochen.lch-ops-panel/
```

**Linux**:
```
~/.config/Code/User/globalStorage/Weylochen.lch-ops-panel/
```

### 📊 空间占用分析

| 分数 | 存储大小 | JSON数据 |
|------|----------|----------|
| 0 | 36 bytes | `{"lchOpsPanel.game2048.bestScore":0}` |
| 2,048 | 39 bytes | `{"lchOpsPanel.game2048.bestScore":2048}` |
| 50,000 | 40 bytes | `{"lchOpsPanel.game2048.bestScore":50000}` |
| 1,000,000 | 42 bytes | `{"lchOpsPanel.game2048.bestScore":1000000}` |
| 999,999,999 | 44 bytes | `{"lchOpsPanel.game2048.bestScore":999999999}` |

### ✅ 结论

**完全不用担心空间占用！**

- 📏 **极小占用**: 即使是天文数字的分数，也只占40-50字节
- 📝 **相当于**: 几十个英文字符的文本量
- 💪 **高效存储**: VS Code的Memento接口经过优化
- 🔄 **自动管理**: VS Code负责序列化和磁盘写入

### 🔍 对比参考

- **一张小图片**: ~10KB (约250倍大)
- **一个短邮件**: ~1KB (约25倍大)  
- **一条推文**: ~280字符 ≈ 280字节 (约7倍大)
- **2048最高分**: 40-50字节 ✨

### 🚀 扩展考虑

如果未来要存储更多游戏数据，可以考虑：

1. **游戏统计**: 游戏次数、平均分数等
2. **多游戏支持**: 每个游戏独立的最高分
3. **历史记录**: 最近几次的分数记录

即使存储这些额外数据，总占用也不会超过1KB。
