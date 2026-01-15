/**
 * 523班同学数据
 * 从 CSV 文件加载数据
 */

let classmatesData = [];
let teachersData = [];

/**
 * 解析 CSV 文件内容
 */
function parseCSV(csvText, customMapping = null) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    const mapping = customMapping || headerMapping;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // 处理 CSV 中可能包含逗号的字段（用引号包裹）
        const values = parseCSVLine(line);
        const obj = {};
        
        headers.forEach((header, index) => {
            const key = mapping[header.trim()] || header.trim();
            obj[key] = values[index] ? values[index].trim() : '';
        });
        
        data.push(obj);
    }
    
    return data;
}

/**
 * 解析单行 CSV（处理引号内的逗号）
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

/**
 * CSV 表头到 JS 属性的映射（同学）
 */
const headerMapping = {
    '姓名': 'name',
    '省份': 'province',
    '城市': 'city',
    '区县': 'district',
    '公司': 'company',
    '职位': 'position',
    '行业': 'industry',
    '电话': 'phone',
    '邮箱': 'email',
    '老家': 'hometown',
    '寄语': 'message'
};

/**
 * CSV 表头到 JS 属性的映射（老师）
 */
const teacherHeaderMapping = {
    '姓名': 'name',
    '科目': 'subject',
    '电话': 'phone',
    '邮箱': 'email',
    '现状': 'status',
    '寄语': 'message'
};

/**
 * 从 CSV 文件加载同学数据
 */
async function loadClassmatesData() {
    try {
        const response = await fetch('data/classmates.csv');
        if (!response.ok) {
            throw new Error('无法加载数据文件');
        }
        const csvText = await response.text();
        classmatesData = parseCSV(csvText, headerMapping);
        console.log(`成功加载 ${classmatesData.length} 位同学的数据`);
        return classmatesData;
    } catch (error) {
        console.error('加载同学数据失败:', error);
        classmatesData = [];
        return classmatesData;
    }
}

/**
 * 从 CSV 文件加载老师数据
 */
async function loadTeachersData() {
    try {
        const response = await fetch('data/teachers.csv');
        if (!response.ok) {
            throw new Error('无法加载老师数据文件');
        }
        const csvText = await response.text();
        teachersData = parseCSV(csvText, teacherHeaderMapping);
        console.log(`成功加载 ${teachersData.length} 位老师的数据`);
        return teachersData;
    } catch (error) {
        console.error('加载老师数据失败:', error);
        teachersData = [];
        return teachersData;
    }
}
