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

/**
 * 从加密文件加载动态数据
 */
let momentsData = [];

async function loadMomentsData() {
    try {
        const response = await fetch('data/encrypted-moments.json');
        if (!response.ok) {
            throw new Error('无法加载动态数据文件');
        }
        const jsonData = await response.json();
        
        if (!storedPassword) {
            throw new Error('未设置解密密码');
        }
        
        momentsData = decryptData(jsonData.data, storedPassword);
        if (!momentsData) {
            throw new Error('解密失败');
        }
        
        console.log(`成功加载 ${momentsData.length} 条动态数据`);
        return momentsData;
    } catch (error) {
        console.error('加载动态数据失败:', error);
        momentsData = [];
        return momentsData;
    }
}

/**
 * 获取本地存储的动态（用户新发布的）
 */
function getLocalMoments() {
    const localData = localStorage.getItem('523_local_moments');
    return localData ? JSON.parse(localData) : [];
}

/**
 * 保存动态到本地存储
 */
function saveLocalMoment(moment) {
    const localMoments = getLocalMoments();
    localMoments.unshift(moment); // 添加到最前面
    localStorage.setItem('523_local_moments', JSON.stringify(localMoments));
    return localMoments;
}

/**
 * 获取所有动态（服务器 + 本地）
 */
function getAllMoments() {
    const localMoments = getLocalMoments();
    const allMoments = [...localMoments, ...momentsData];
    // 按时间排序（最新的在前）
    allMoments.sort((a, b) => new Date(b.time) - new Date(a.time));
    return allMoments;
}
