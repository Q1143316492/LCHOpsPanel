#!/usr/bin/env python3
"""
安装终端平铺管理器所需的依赖
"""

import subprocess
import sys
import os

def install_dependencies():
    """安装必要的Python依赖"""
    dependencies = [
        'pywin32'  # Windows API访问
    ]
    
    print("正在安装终端平铺管理器所需的依赖...")
    
    for dep in dependencies:
        try:
            print(f"安装 {dep}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', dep])
            print(f"✓ {dep} 安装成功")
        except subprocess.CalledProcessError as e:
            print(f"✗ {dep} 安装失败: {e}")
            return False
    
    print("\n所有依赖安装完成!")
    print("现在可以运行 terminal_tiler.py 了")
    return True

def test_installation():
    """测试安装是否成功"""
    try:
        import win32gui
        import win32con
        import win32api
        print("✓ pywin32 导入成功")
        return True
    except ImportError as e:
        print(f"✗ 导入失败: {e}")
        return False

if __name__ == "__main__":
    print("终端平铺管理器 - 依赖安装脚本")
    print("=" * 40)
    
    if install_dependencies():
        print("\n测试安装...")
        if test_installation():
            print("\n🎉 安装成功! 可以开始使用终端平铺管理器了")
            print("\n使用示例:")
            print("  python terminal_tiler.py gas")
            print("  python terminal_tiler.py --list")
        else:
            print("\n❌ 安装测试失败，请检查错误信息")
    else:
        print("\n❌ 依赖安装失败")
