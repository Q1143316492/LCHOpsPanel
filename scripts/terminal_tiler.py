#!/usr/bin/env python3
"""
终端平铺管理器
通过输入参数搜索并平铺相关终端窗口
支持Windows平台，默认优先竖向平铺
"""

import argparse
import sys
import re
import time
from typing import List, Tuple, Optional
import subprocess

# Windows API相关导入
try:
    import win32gui
    import win32con
    import win32api
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False
    print("警告: 未安装pywin32，某些功能可能不可用")
    print("请运行: pip install pywin32")

class TerminalTiler:
    """终端平铺管理器"""
    
    def __init__(self):
        self.screen_width = 1920
        self.screen_height = 1080
        if HAS_WIN32:
            self.screen_width = win32api.GetSystemMetrics(win32con.SM_CXSCREEN)
            self.screen_height = win32api.GetSystemMetrics(win32con.SM_CYSCREEN)
    
    def find_terminal_windows(self, keyword: str) -> List[Tuple[int, str]]:
        """
        查找包含关键字的终端窗口
        返回: [(窗口句柄, 窗口标题), ...]
        """
        if not HAS_WIN32:
            print(f"模拟查找包含 '{keyword}' 的终端窗口...")
            return [(12345, f"模拟终端 - {keyword}1"), (12346, f"模拟终端 - {keyword}2")]
        
        windows = []
        
        def enum_window_callback(hwnd, windows):
            if win32gui.IsWindowVisible(hwnd):
                window_title = win32gui.GetWindowText(hwnd)
                class_name = win32gui.GetClassName(hwnd)
                
                # 检查是否为终端窗口类型
                terminal_classes = [
                    'ConsoleWindowClass',  # 传统命令提示符
                    'CASCADIA_HOSTING_WINDOW_CLASS',  # Windows Terminal
                    'PseudoConsoleWindow',  # PowerShell
                    'WindowsTerminal',
                    'VirtualConsoleClass'
                ]
                
                is_terminal = any(term_class in class_name for term_class in terminal_classes)
                has_keyword = keyword.lower() in window_title.lower()
                
                if is_terminal and has_keyword:
                    windows.append((hwnd, window_title))
                    print(f"找到终端: {window_title} (类名: {class_name})")
            
            return True
        
        try:
            win32gui.EnumWindows(enum_window_callback, windows)
        except Exception as e:
            print(f"枚举窗口时出错: {e}")
        
        return windows
    
    def tile_windows_vertical(self, windows: List[Tuple[int, str]], gap: int = 5):
        """
        垂直平铺窗口
        """
        if not windows:
            print("没有找到要平铺的窗口")
            return
        
        print(f"开始垂直平铺 {len(windows)} 个窗口...")
        
        # 计算每个窗口的尺寸
        window_height = (self.screen_height - gap * (len(windows) + 1)) // len(windows)
        window_width = self.screen_width - gap * 2
        
        for i, (hwnd, title) in enumerate(windows):
            x = gap
            y = gap + i * (window_height + gap)
            
            if HAS_WIN32:
                try:
                    # 确保窗口处于正常状态
                    win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                    # 移动和调整窗口大小
                    win32gui.SetWindowPos(
                        hwnd, 
                        win32con.HWND_TOP, 
                        x, y, window_width, window_height,
                        win32con.SWP_SHOWWINDOW
                    )
                    print(f"已平铺窗口: {title} -> 位置({x}, {y}) 大小({window_width}, {window_height})")
                except Exception as e:
                    print(f"平铺窗口 '{title}' 时出错: {e}")
            else:
                print(f"模拟平铺窗口: {title} -> 位置({x}, {y}) 大小({window_width}, {window_height})")
            
            # 短暂延迟，让窗口有时间响应
            time.sleep(0.1)
    
    def tile_windows_horizontal(self, windows: List[Tuple[int, str]], gap: int = 5):
        """
        水平平铺窗口
        """
        if not windows:
            print("没有找到要平铺的窗口")
            return
        
        print(f"开始水平平铺 {len(windows)} 个窗口...")
        
        # 计算每个窗口的尺寸
        window_width = (self.screen_width - gap * (len(windows) + 1)) // len(windows)
        window_height = self.screen_height - gap * 2
        
        for i, (hwnd, title) in enumerate(windows):
            x = gap + i * (window_width + gap)
            y = gap
            
            if HAS_WIN32:
                try:
                    # 确保窗口处于正常状态
                    win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                    # 移动和调整窗口大小
                    win32gui.SetWindowPos(
                        hwnd, 
                        win32con.HWND_TOP, 
                        x, y, window_width, window_height,
                        win32con.SWP_SHOWWINDOW
                    )
                    print(f"已平铺窗口: {title} -> 位置({x}, {y}) 大小({window_width}, {window_height})")
                except Exception as e:
                    print(f"平铺窗口 '{title}' 时出错: {e}")
            else:
                print(f"模拟平铺窗口: {title} -> 位置({x}, {y}) 大小({window_width}, {window_height})")
            
            # 短暂延迟，让窗口有时间响应
            time.sleep(0.1)
    
    def list_all_terminals(self):
        """
        列出所有终端窗口
        """
        if not HAS_WIN32:
            print("模拟模式：列出所有终端窗口")
            terminals = [
                "gas1 - PowerShell",
                "gas2 - PowerShell", 
                "gcc1 - Command Prompt",
                "gcc2 - Command Prompt",
                "gds - Windows Terminal"
            ]
            for terminal in terminals:
                print(f"  - {terminal}")
            return
        
        print("搜索所有终端窗口...")
        all_windows = []
        
        def enum_all_callback(hwnd, windows):
            if win32gui.IsWindowVisible(hwnd):
                window_title = win32gui.GetWindowText(hwnd)
                class_name = win32gui.GetClassName(hwnd)
                
                terminal_classes = [
                    'ConsoleWindowClass',
                    'CASCADIA_HOSTING_WINDOW_CLASS',
                    'PseudoConsoleWindow',
                    'WindowsTerminal',
                    'VirtualConsoleClass'
                ]
                
                if any(term_class in class_name for term_class in terminal_classes) and window_title:
                    windows.append((hwnd, window_title, class_name))
            
            return True
        
        win32gui.EnumWindows(enum_all_callback, all_windows)
        
        if all_windows:
            print(f"找到 {len(all_windows)} 个终端窗口:")
            for hwnd, title, class_name in all_windows:
                print(f"  - {title} ({class_name})")
        else:
            print("未找到任何终端窗口")

def main():
    parser = argparse.ArgumentParser(
        description="终端平铺管理器 - 搜索并平铺相关终端窗口",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python terminal_tiler.py gas                    # 垂直平铺所有包含'gas'的终端
  python terminal_tiler.py gas --horizontal       # 水平平铺所有包含'gas'的终端
  python terminal_tiler.py --list                 # 列出所有终端窗口
  python terminal_tiler.py gcc --gap 10           # 平铺gcc相关终端，窗口间距为10像素
        """
    )
    
    parser.add_argument(
        'keyword', 
        nargs='?',
        help='要搜索的终端关键字 (如: gas, gcc, gds)'
    )
    
    parser.add_argument(
        '--horizontal', 
        action='store_true',
        help='水平平铺窗口 (默认为垂直平铺)'
    )
    
    parser.add_argument(
        '--gap', 
        type=int, 
        default=5,
        help='窗口间距 (像素，默认5)'
    )
    
    parser.add_argument(
        '--list', 
        action='store_true',
        help='列出所有终端窗口'
    )
    
    args = parser.parse_args()
    
    tiler = TerminalTiler()
    
    if args.list:
        tiler.list_all_terminals()
        return
    
    if not args.keyword:
        print("错误: 请提供要搜索的关键字，或使用 --list 查看所有终端")
        parser.print_help()
        return
    
    print(f"搜索包含关键字 '{args.keyword}' 的终端窗口...")
    windows = tiler.find_terminal_windows(args.keyword)
    
    if not windows:
        print(f"未找到包含 '{args.keyword}' 的终端窗口")
        print("使用 --list 参数查看所有可用的终端窗口")
        return
    
    print(f"找到 {len(windows)} 个匹配的终端窗口:")
    for hwnd, title in windows:
        print(f"  - {title}")
    
    # 平铺窗口
    if args.horizontal:
        tiler.tile_windows_horizontal(windows, args.gap)
    else:
        tiler.tile_windows_vertical(windows, args.gap)
    
    print("终端平铺完成!")

if __name__ == "__main__":
    main()
