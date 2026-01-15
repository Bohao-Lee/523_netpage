/**
 * 523班同学数据
 * 从加密的 JSON 文件加载数据
 */

let classmatesData = [];
let teachersData = [];

// 存储密码用于解密
let storedPassword = '';

/**
 * 设置密码（用于解密数据）
 */
function setDecryptionPassword(password) {
    storedPassword = password;
}

/**
 * 生成加密密钥
 */
function generateKey(password, length) {
    const key = [];
    for (let i = 0; i < length; i++) {
        key.push(password.charCodeAt(i % password.length));
    }
    return key;
}

/**
 * 解密数据
 */
function decryptData(encryptedData, password) {
    try {
        // Base64 解码
        const binaryString = atob(encryptedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // 生成密钥
        const key = generateKey(password, bytes.length);
        
        // XOR 解密
        const decryptedBytes = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            decryptedBytes[i] = bytes[i] ^ key[i];
        }
        
        // UTF-8 解码
        const decoder = new TextDecoder('utf-8');
        const jsonStr = decoder.decode(decryptedBytes);
        
        // 解析 JSON
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('解密失败:', error);
        return null;
    }
}

/**
 * 从加密文件加载同学数据
 */
async function loadClassmatesData() {
    try {
        const response = await fetch('data/encrypted-classmates.json');
        if (!response.ok) {
            throw new Error('无法加载数据文件');
        }
        const jsonData = await response.json();
        
        if (!storedPassword) {
            throw new Error('未设置解密密码');
        }
        
        classmatesData = decryptData(jsonData.data, storedPassword);
        if (!classmatesData) {
            throw new Error('解密失败');
        }
        
        console.log(`成功加载 ${classmatesData.length} 位同学的数据`);
        return classmatesData;
    } catch (error) {
        console.error('加载同学数据失败:', error);
        classmatesData = [];
        return classmatesData;
    }
}

/**
 * 从加密文件加载老师数据
 */
async function loadTeachersData() {
    try {
        const response = await fetch('data/encrypted-teachers.json');
        if (!response.ok) {
            throw new Error('无法加载老师数据文件');
        }
        const jsonData = await response.json();
        
        if (!storedPassword) {
            throw new Error('未设置解密密码');
        }
        
        teachersData = decryptData(jsonData.data, storedPassword);
        if (!teachersData) {
            throw new Error('解密失败');
        }
        
        console.log(`成功加载 ${teachersData.length} 位老师的数据`);
        return teachersData;
    } catch (error) {
        console.error('加载老师数据失败:', error);
        teachersData = [];
        return teachersData;
    }
}
