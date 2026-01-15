/**
 * 中国地图模块 - 使用 ECharts 渲染真实中国地图
 */

let chinaChart = null;
let chinaGeoJSON = null;

/**
 * 加载中国地图 GeoJSON 数据
 */
async function loadChinaMap() {
    try {
        const response = await fetch('data/china.json');
        if (!response.ok) {
            throw new Error('无法加载地图数据');
        }
        chinaGeoJSON = await response.json();
        console.log('中国地图数据加载成功');
        return chinaGeoJSON;
    } catch (error) {
        console.error('加载地图数据失败:', error);
        return null;
    }
}

/**
 * 初始化 ECharts 地图
 */
function initChinaMap(containerId, provinceData, onProvinceClick) {
    const container = document.getElementById(containerId);
    if (!container || !chinaGeoJSON) {
        console.error('地图容器或数据不存在');
        return null;
    }
    
    // 注册地图
    echarts.registerMap('china', chinaGeoJSON);
    
    // 初始化 ECharts 实例
    chinaChart = echarts.init(container);
    
    // 处理省份名称映射（去掉"省"、"市"等后缀以匹配数据）
    const processedData = processProvinceData(provinceData);
    
    // 配置项
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const name = params.name;
                const count = params.value || 0;
                return `<strong>${name}</strong><br/>同学数量: ${count}人`;
            },
            backgroundColor: 'rgba(50, 50, 50, 0.9)',
            borderColor: '#333',
            textStyle: {
                color: '#fff'
            }
        },
        visualMap: {
            min: 0,
            max: 5,
            left: 'left',
            top: 'bottom',
            text: ['多', '少'],
            inRange: {
                color: ['#e0e0e0', '#6bcb77', '#ffd93d', '#ff6b6b']
            },
            show: true,
            calculable: true
        },
        series: [{
            name: '同学分布',
            type: 'map',
            map: 'china',
            roam: true, // 允许缩放和拖拽
            zoom: 1.2,
            center: [105, 36],
            scaleLimit: {
                min: 0.8,
                max: 3
            },
            label: {
                show: true,
                fontSize: 10,
                color: '#333'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#333'
                },
                itemStyle: {
                    areaColor: '#667eea',
                    shadowColor: 'rgba(0, 0, 0, 0.3)',
                    shadowBlur: 10
                }
            },
            select: {
                label: {
                    show: true,
                    color: '#fff'
                },
                itemStyle: {
                    areaColor: '#5a67d8'
                }
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1
            },
            data: processedData
        }]
    };
    
    chinaChart.setOption(option);
    
    // 绑定点击事件
    chinaChart.on('click', function(params) {
        if (params.componentType === 'series') {
            const provinceName = params.name;
            if (onProvinceClick) {
                onProvinceClick(provinceName);
            }
        }
    });
    
    // 响应窗口大小变化
    window.addEventListener('resize', function() {
        if (chinaChart) {
            chinaChart.resize();
        }
    });
    
    return chinaChart;
}

/**
 * 处理省份数据，匹配地图中的省份名称
 */
function processProvinceData(provinceCount) {
    // 省份名称映射（简称 -> 地图全称）
    const nameMapping = {
        '北京': '北京市',
        '天津': '天津市',
        '上海': '上海市',
        '重庆': '重庆市',
        '河北': '河北省',
        '山西': '山西省',
        '辽宁': '辽宁省',
        '吉林': '吉林省',
        '黑龙江': '黑龙江省',
        '江苏': '江苏省',
        '浙江': '浙江省',
        '安徽': '安徽省',
        '福建': '福建省',
        '江西': '江西省',
        '山东': '山东省',
        '河南': '河南省',
        '湖北': '湖北省',
        '湖南': '湖南省',
        '广东': '广东省',
        '海南': '海南省',
        '四川': '四川省',
        '贵州': '贵州省',
        '云南': '云南省',
        '陕西': '陕西省',
        '甘肃': '甘肃省',
        '青海': '青海省',
        '台湾': '台湾省',
        '内蒙古': '内蒙古自治区',
        '广西': '广西壮族自治区',
        '西藏': '西藏自治区',
        '宁夏': '宁夏回族自治区',
        '新疆': '新疆维吾尔自治区',
        '香港': '香港特别行政区',
        '澳门': '澳门特别行政区'
    };
    
    const result = [];
    
    // 遍历数据，转换为 ECharts 格式
    for (const [shortName, count] of Object.entries(provinceCount)) {
        const fullName = nameMapping[shortName] || shortName;
        result.push({
            name: fullName,
            value: count
        });
    }
    
    return result;
}

/**
 * 更新地图数据
 */
function updateMapData(provinceCount) {
    if (!chinaChart) return;
    
    const processedData = processProvinceData(provinceCount);
    
    chinaChart.setOption({
        series: [{
            data: processedData
        }]
    });
}

/**
 * 省份全称转简称
 */
function getShortProvinceName(fullName) {
    const reverseMapping = {
        '北京市': '北京',
        '天津市': '天津',
        '上海市': '上海',
        '重庆市': '重庆',
        '河北省': '河北',
        '山西省': '山西',
        '辽宁省': '辽宁',
        '吉林省': '吉林',
        '黑龙江省': '黑龙江',
        '江苏省': '江苏',
        '浙江省': '浙江',
        '安徽省': '安徽',
        '福建省': '福建',
        '江西省': '江西',
        '山东省': '山东',
        '河南省': '河南',
        '湖北省': '湖北',
        '湖南省': '湖南',
        '广东省': '广东',
        '海南省': '海南',
        '四川省': '四川',
        '贵州省': '贵州',
        '云南省': '云南',
        '陕西省': '陕西',
        '甘肃省': '甘肃',
        '青海省': '青海',
        '台湾省': '台湾',
        '内蒙古自治区': '内蒙古',
        '广西壮族自治区': '广西',
        '西藏自治区': '西藏',
        '宁夏回族自治区': '宁夏',
        '新疆维吾尔自治区': '新疆',
        '香港特别行政区': '香港',
        '澳门特别行政区': '澳门'
    };
    
    return reverseMapping[fullName] || fullName;
}
