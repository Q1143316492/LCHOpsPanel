#!/usr/bin/env python3
"""
测试新的智能终端平铺算法
"""

from terminal_tiler import TerminalTiler
import sys

def test_grid_calculation():
    """测试网格计算算法"""
    print("=== 测试智能网格布局算法 ===\n")
    
    tiler = TerminalTiler()
    
    # 测试不同数量窗口的布局
    test_cases = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
    
    print("垂直优先布局 (适合查看日志):")
    print("-" * 50)
    for num in test_cases:
        cols, rows_per_col = tiler._calculate_optimal_grid(num, prefer_vertical=True)
        total_check = sum(rows_per_col)
        status = "✓" if total_check == num else "✗"
        print(f"{num:2d}个窗口 -> {cols}列 {rows_per_col} {status}")
    
    print("\n水平优先布局 (传统平铺):")
    print("-" * 50)
    for num in test_cases:
        cols, rows_per_col = tiler._calculate_optimal_grid(num, prefer_vertical=False)
        total_check = sum(rows_per_col)
        status = "✓" if total_check == num else "✗"
        max_rows = max(rows_per_col) if rows_per_col else 0
        print(f"{num:2d}个窗口 -> {cols}列{max_rows}行 {rows_per_col} {status}")

def test_mock_tiling():
    """测试模拟平铺功能"""
    print("\n=== 测试模拟平铺功能 ===\n")
    
    tiler = TerminalTiler()
    
    # 创建模拟窗口数据
    test_scenarios = [
        ("2个gas终端", [(1001, "gas1-terminal"), (1002, "gas2-terminal")]),
        ("3个gcc终端", [(2001, "gcc1-compiler"), (2002, "gcc2-build"), (2003, "gcc3-debug")]),
        ("5个混合终端", [
            (3001, "gas1-monitor"), (3002, "gas2-log"), (3003, "gcc1-build"), 
            (3004, "gcc2-test"), (3005, "gds-server")
        ])
    ]
    
    for scenario_name, windows in test_scenarios:
        print(f"\n--- {scenario_name} ---")
        
        print("垂直平铺:")
        tiler.tile_windows_vertical(windows, gap=10)
        
        print("\n水平平铺:")  
        tiler.tile_windows_horizontal(windows, gap=10)
        print()

def show_window_size_examples():
    """展示不同数量窗口的实际尺寸"""
    print("\n=== 窗口尺寸示例 (屏幕 2560x1440) ===\n")
    
    tiler = TerminalTiler()
    gap = 5
    
    scenarios = [
        ("单个终端", 1),
        ("2个终端", 2), 
        ("3个终端", 3),
        ("4个终端", 4),
        ("6个终端", 6)
    ]
    
    for name, num_windows in scenarios:
        print(f"{name} - 垂直平铺:")
        
        # 计算垂直布局
        cols, rows_per_col = tiler._calculate_optimal_grid(num_windows, prefer_vertical=True)
        
        available_width = tiler.screen_width - gap * (cols + 1)
        window_width = available_width // cols
        
        max_window_height = 600  # 限制最大高度
        min_window_height = 200
        available_height = tiler.screen_height - gap * (max(rows_per_col) + 1)
        window_height = min(max_window_height, max(min_window_height, available_height // max(rows_per_col)))
        
        print(f"  布局: {cols}列，每列{rows_per_col}行")
        print(f"  尺寸: {window_width}x{window_height} (宽x高)")
        print(f"  高度限制: 最小{min_window_height}px，最大{max_window_height}px")
        print()

if __name__ == "__main__":
    print("智能终端平铺算法测试")
    print("=" * 60)
    
    test_grid_calculation()
    test_mock_tiling()
    show_window_size_examples()
    
    print("=" * 60)
    print("测试完成!")
    print("\n改进要点:")
    print("✓ 3个以上窗口自动使用多列布局，避免过挤")
    print("✓ 限制终端最大高度为600px，适合查看日志")  
    print("✓ 保持最小高度200px，确保可读性")
    print("✓ 智能分配窗口到各列，布局更均匀")
