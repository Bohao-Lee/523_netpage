#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 JPG 图片转换为 SVG（使用 Base64 嵌入方式）
同时压缩图片尺寸
"""

from PIL import Image
import base64
import io
import os

def convert_jpg_to_svg(input_path, output_path, max_size=200):
    """
    将 JPG 图片转换为 SVG
    通过压缩图片并嵌入 Base64 数据
    """
    # 打开图片
    img = Image.open(input_path)
    
    # 获取原始尺寸
    orig_width, orig_height = img.size
    print(f"原始尺寸: {orig_width}x{orig_height}")
    
    # 计算新尺寸（保持比例）
    if orig_width > orig_height:
        new_width = max_size
        new_height = int(max_size * orig_height / orig_width)
    else:
        new_height = max_size
        new_width = int(max_size * orig_width / orig_height)
    
    # 缩放图片
    img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    print(f"缩放后尺寸: {new_width}x{new_height}")
    
    # 转换为 PNG（支持透明背景）并移除白色背景
    img_rgba = img_resized.convert('RGBA')
    datas = img_rgba.getdata()
    
    new_data = []
    for item in datas:
        # 如果是白色或接近白色，设为透明
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # 透明
        else:
            new_data.append(item)
    
    img_rgba.putdata(new_data)
    
    # 保存为 PNG 字节流
    png_buffer = io.BytesIO()
    img_rgba.save(png_buffer, format='PNG', optimize=True)
    png_data = png_buffer.getvalue()
    
    # 转换为 Base64
    base64_data = base64.b64encode(png_data).decode('ascii')
    
    # 创建 SVG
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="{new_width}" height="{new_height}" viewBox="0 0 {new_width} {new_height}">
  <image width="{new_width}" height="{new_height}" 
         xlink:href="data:image/png;base64,{base64_data}"/>
</svg>'''
    
    # 保存 SVG
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    svg_size = os.path.getsize(output_path)
    print(f"SVG 文件大小: {svg_size / 1024:.1f} KB")
    print(f"✓ 已保存到: {output_path}")
    
    # 同时保存一份压缩的 PNG（备用）
    png_path = output_path.replace('.svg', '.png')
    img_rgba.save(png_path, format='PNG', optimize=True)
    png_size = os.path.getsize(png_path)
    print(f"PNG 文件大小: {png_size / 1024:.1f} KB")
    print(f"✓ 已保存到: {png_path}")

if __name__ == '__main__':
    input_file = 'image/523.jpg'
    output_file = 'image/523.svg'
    
    # 转换（最大尺寸 200px）
    convert_jpg_to_svg(input_file, output_file, max_size=200)
