#!/usr/bin/env python3
"""
终端平铺管理器测试脚本
"""

from terminal_tiler import TerminalTiler
import sys

def test_terminal_tiler():
    print("=== 终端平铺管理器测试 ===")
    
    tiler = TerminalTiler()
    
    # 测试1: 检查屏幕尺寸
    print(f"屏幕尺寸: {tiler.screen_width} x {tiler.screen_height}")
    
    # 测试2: 模拟查找终端
    print("\n测试查找终端功能:")
    windows = tiler.find_terminal_windows("gas")
    print(f"找到 {len(windows)} 个匹配的终端")
    for hwnd, title in windows:
        print(f"  - {title}")
    
    # 测试3: 模拟平铺
    if windows:
        print("\n测试垂直平铺:")
        tiler.tile_windows_vertical(windows)
        
        print("\n测试水平平铺:")
        tiler.tile_windows_horizontal(windows)
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    test_terminal_tiler()
