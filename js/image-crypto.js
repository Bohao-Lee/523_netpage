/**
 * 图片解密模块
 * 用于解密加密存储的图片
 */

// 缓存已解密的图片
const decryptedImagesCache = {};

/**
 * 生成加密密钥
 */
function generateImageKey(password, length) {
    const key = [];
    for (let i = 0; i < length; i++) {
        key.push(password.charCodeAt(i % password.length));
    }
    return key;
}

/**
 * 解密图片数据
 */
function decryptImageData(encryptedData, password) {
    try {
        // Base64 解码
        const binaryString = atob(encryptedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // 生成密钥
        const key = generateImageKey(password, bytes.length);
        
        // XOR 解密
        const decryptedBytes = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            decryptedBytes[i] = bytes[i] ^ key[i];
        }
        
        // UTF-8 解码得到 Base64 图片数据
        const decoder = new TextDecoder('utf-8');
        const base64ImageData = decoder.decode(decryptedBytes);
        
        return base64ImageData;
    } catch (error) {
        console.error('图片解密失败:', error);
        return null;
    }
}

/**
 * 加载加密的图片集合
 */
async function loadEncryptedImages(jsonPath, password) {
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            return {};
        }
        const data = await response.json();
        
        // 解密所有图片
        const decryptedImages = {};
        for (const [name, imageInfo] of Object.entries(data)) {
            const decryptedBase64 = decryptImageData(imageInfo.data, password);
            if (decryptedBase64) {
                decryptedImages[name] = `data:${imageInfo.type};base64,${decryptedBase64}`;
            }
        }
        
        return decryptedImages;
    } catch (error) {
        console.error('加载加密图片失败:', error);
        return {};
    }
}

/**
 * 获取解密后的图片 URL
 * @param {string} imageName - 图片名称（不含扩展名）
 * @param {string} type - 图片类型：'photos' 或 'gallery'
 * @returns {string} - 图片的 Data URL 或默认头像
 */
function getDecryptedImageUrl(imageName, type = 'photos') {
    const cache = type === 'photos' ? window.decryptedPhotos : window.decryptedGallery;
    
    if (cache && cache[imageName]) {
        return cache[imageName];
    }
    
    return null;
}

/**
 * 解密照片数据（二进制图片）
 * @param {string} encryptedBase64 - 加密后的Base64字符串
 * @param {string} password - 密码
 * @returns {Blob} - 解密后的图片Blob
 */
function decryptPhotoToBlob(encryptedBase64, password) {
    try {
        // Base64 解码
        const binaryString = atob(encryptedBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // XOR 解密
        const passwordBytes = new TextEncoder().encode(password);
        const decryptedBytes = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            decryptedBytes[i] = bytes[i] ^ passwordBytes[i % passwordBytes.length];
        }
        
        // 创建 Blob
        return new Blob([decryptedBytes], { type: 'image/jpeg' });
    } catch (error) {
        console.error('照片解密失败:', error);
        return null;
    }
}

/**
 * 解密照片并返回 Object URL
 * @param {string} encryptedBase64 - 加密后的Base64字符串
 * @param {string} password - 密码
 * @returns {string} - Object URL
 */
function decryptPhotoToUrl(encryptedBase64, password) {
    const blob = decryptPhotoToBlob(encryptedBase64, password);
    if (blob) {
        return URL.createObjectURL(blob);
    }
    return null;
}

/**
 * 加载相册索引
 */
async function loadAlbumsIndex() {
    try {
        const response = await fetch('data/encrypted-photos/albums-index.json');
        if (!response.ok) {
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('加载相册索引失败:', error);
        return [];
    }
}

/**
 * 加载单个相册数据
 */
async function loadAlbum(albumFile) {
    try {
        const response = await fetch(`data/encrypted-photos/${albumFile}`);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('加载相册失败:', error);
        return null;
    }
}

/**
 * 加载单张原图（按需加载）
 */
async function loadOriginalPhoto(originalFile) {
    try {
        const response = await fetch(`data/encrypted-photos/${originalFile}`);
        if (!response.ok) {
            return null;
        }
        return await response.text();
    } catch (error) {
        console.error('加载原图失败:', error);
        return null;
    }
}

// 导出到全局
window.loadEncryptedImages = loadEncryptedImages;
window.getDecryptedImageUrl = getDecryptedImageUrl;
window.decryptPhotoToBlob = decryptPhotoToBlob;
window.decryptPhotoToUrl = decryptPhotoToUrl;
window.loadAlbumsIndex = loadAlbumsIndex;
window.loadAlbum = loadAlbum;
window.loadOriginalPhoto = loadOriginalPhoto;
window.decryptedPhotos = {};
window.decryptedGallery = {};
