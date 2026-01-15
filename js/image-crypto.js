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

// 导出到全局
window.loadEncryptedImages = loadEncryptedImages;
window.getDecryptedImageUrl = getDecryptedImageUrl;
window.decryptedPhotos = {};
window.decryptedGallery = {};
