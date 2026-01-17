#!/usr/bin/env python3
"""
照片处理脚本：
1. 生成缩略图（用于预览）
2. 对原图和缩略图进行加密（XOR + Base64）
3. 分开存储：缩略图索引小文件 + 原图单独大文件
"""

import os
import base64
import json
from PIL import Image
from io import BytesIO

# 加密密钥（与网站密码一致）
PASSWORD = "523forever"

# 照片文件夹配置
PHOTO_FOLDERS = [
    {
        "source": "image/11.26登山照片",
        "name": "登山照片",
        "date": "2014-11-26",
        "description": "523班登山活动"
    },
    {
        "source": "image/2014.11.5罗建夫班牌照相",
        "name": "班牌合影",
        "date": "2014-11-05",
        "description": "罗建夫班牌照相留念"
    }
]

# 输出目录
OUTPUT_DIR = "data/encrypted-photos"
ORIGINALS_DIR = "data/encrypted-photos/originals"
THUMBNAIL_SIZE = (400, 300)  # 缩略图尺寸
THUMBNAIL_QUALITY = 70  # 缩略图质量


def xor_encrypt(data: bytes, password: str) -> bytes:
    """XOR加密"""
    key = password.encode('utf-8')
    key_len = len(key)
    return bytes([data[i] ^ key[i % key_len] for i in range(len(data))])


def encrypt_to_base64(data: bytes, password: str) -> str:
    """加密并转为Base64字符串"""
    encrypted = xor_encrypt(data, password)
    return base64.b64encode(encrypted).decode('utf-8')


def create_thumbnail(image_path: str) -> bytes:
    """创建缩略图并返回JPEG字节数据"""
    with Image.open(image_path) as img:
        # 转换为RGB（处理RGBA等格式）
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # 保持宽高比缩放
        img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        
        # 转换为JPEG字节
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=THUMBNAIL_QUALITY, optimize=True)
        return buffer.getvalue()


def read_image_bytes(image_path: str) -> bytes:
    """读取图片原始字节"""
    with open(image_path, 'rb') as f:
        return f.read()


def process_folder(folder_config: dict, base_path: str, originals_dir: str) -> dict:
    """处理单个文件夹的照片"""
    folder_path = os.path.join(base_path, folder_config["source"])
    
    if not os.path.exists(folder_path):
        print(f"警告：文件夹不存在 {folder_path}")
        return None
    
    photos = []
    
    # 获取所有图片文件
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    files = sorted([
        f for f in os.listdir(folder_path)
        if os.path.splitext(f.lower())[1] in image_extensions
    ])
    
    print(f"\n处理文件夹: {folder_config['name']} ({len(files)} 张照片)")
    
    for i, filename in enumerate(files):
        image_path = os.path.join(folder_path, filename)
        print(f"  [{i+1}/{len(files)}] 处理: {filename}", end=" ")
        
        try:
            # 读取原图
            original_bytes = read_image_bytes(image_path)
            original_size = len(original_bytes)
            
            # 创建缩略图
            thumbnail_bytes = create_thumbnail(image_path)
            thumbnail_size = len(thumbnail_bytes)
            
            # 加密缩略图（直接嵌入索引）
            encrypted_thumbnail = encrypt_to_base64(thumbnail_bytes, PASSWORD)
            
            # 加密原图（单独存储到文件）
            photo_id = f"{folder_config['name']}_{i+1}"
            original_filename = f"{photo_id}.enc"
            original_path = os.path.join(originals_dir, original_filename)
            
            encrypted_original = encrypt_to_base64(original_bytes, PASSWORD)
            with open(original_path, 'w', encoding='utf-8') as f:
                f.write(encrypted_original)
            
            photos.append({
                "id": photo_id,
                "filename": filename,
                "thumbnail": encrypted_thumbnail,
                "originalFile": f"originals/{original_filename}",
                "originalSize": original_size,
                "thumbnailSize": thumbnail_size
            })
            
            print(f"✓ (原图: {original_size//1024}KB, 缩略图: {thumbnail_size//1024}KB)")
            
        except Exception as e:
            print(f"✗ 错误: {e}")
    
    return {
        "name": folder_config["name"],
        "date": folder_config["date"],
        "description": folder_config["description"],
        "count": len(photos),
        "photos": photos
    }


def main():
    base_path = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(base_path, OUTPUT_DIR)
    originals_dir = os.path.join(base_path, ORIGINALS_DIR)
    
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(originals_dir, exist_ok=True)
    
    print("=" * 50)
    print("523班照片加密处理工具")
    print("=" * 50)
    
    albums = []
    
    for folder_config in PHOTO_FOLDERS:
        album = process_folder(folder_config, base_path, originals_dir)
        if album:
            albums.append(album)
            
            # 单独保存每个相册索引（只含缩略图，不含原图）
            album_filename = f"album_{folder_config['name']}.json"
            album_path = os.path.join(output_dir, album_filename)
            
            with open(album_path, 'w', encoding='utf-8') as f:
                json.dump(album, f, ensure_ascii=False)
            
            # 计算文件大小
            file_size = os.path.getsize(album_path)
            print(f"  索引保存到: {album_path} ({file_size//1024}KB)")
    
    # 保存相册索引
    index = [{
        "name": a["name"],
        "date": a["date"],
        "description": a["description"],
        "count": a["count"],
        "file": f"album_{a['name']}.json"
    } for a in albums]
    
    index_path = os.path.join(output_dir, "albums-index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    # 统计原图文件
    original_files = os.listdir(originals_dir)
    total_original_size = sum(
        os.path.getsize(os.path.join(originals_dir, f)) 
        for f in original_files
    )
    
    print("\n" + "=" * 50)
    print(f"处理完成！共 {len(albums)} 个相册")
    print(f"索引文件: {index_path}")
    print(f"原图文件: {len(original_files)} 个 (共 {total_original_size//1024//1024}MB)")
    print("=" * 50)


if __name__ == "__main__":
    main()
