/**
 * 523班高中毕业十周年纪念网站 - 主程序
 */

// 密码配置（实际使用中建议在服务端验证）
const SITE_PASSWORD = '523forever';

// 国家/地区到国旗表情的映射
const COUNTRY_FLAGS = {
    '英国': '🇬🇧',
    '美国': '🇺🇸',
    '加拿大': '🇨🇦',
    '澳大利亚': '🇦🇺',
    '日本': '🇯🇵',
    '韩国': '🇰🇷',
    '新加坡': '🇸🇬',
    '德国': '🇩🇪',
    '法国': '🇫🇷',
    '意大利': '🇮🇹',
    '荷兰': '🇳🇱',
    '瑞士': '🇨🇭',
    '新西兰': '🇳🇿',
    '马来西亚': '🇲🇾',
    '泰国': '🇹🇭',
    '香港': '🇭🇰',
    '澳门': '🇲🇴',
    '台湾': '🇹🇼',
    '俄罗斯': '🇷🇺',
    '西班牙': '🇪🇸',
    '葡萄牙': '🇵🇹',
    '爱尔兰': '🇮🇪',
    '瑞典': '🇸🇪',
    '挪威': '🇳🇴',
    '丹麦': '🇩🇰',
    '芬兰': '🇫🇮',
    '比利时': '🇧🇪',
    '奥地利': '🇦🇹',
    '阿联酋': '🇦🇪',
    '印度': '🇮🇳',
    '越南': '🇻🇳',
    '菲律宾': '🇵🇭',
    '印度尼西亚': '🇮🇩',
    '巴西': '🇧🇷',
    '墨西哥': '🇲🇽',
    '阿根廷': '🇦🇷',
    '南非': '🇿🇦',
    '埃及': '🇪🇬',
    '以色列': '🇮🇱',
    '土耳其': '🇹🇷',
    '波兰': '🇵🇱',
    '捷克': '🇨🇿',
    '匈牙利': '🇭🇺',
    '希腊': '🇬🇷',
    '海外': '🌍'
};

// 中国省份列表（用于判断是否为海外）
const CHINA_PROVINCES = [
    '北京', '天津', '上海', '重庆',
    '河北', '山西', '辽宁', '吉林', '黑龙江',
    '江苏', '浙江', '安徽', '福建', '江西', '山东',
    '河南', '湖北', '湖南', '广东', '海南',
    '四川', '贵州', '云南', '陕西', '甘肃', '青海',
    '内蒙古', '广西', '西藏', '宁夏', '新疆',
    '香港', '澳门', '台湾'
];

class ClassReunionApp {
    constructor() {
        this.classmates = [];
        this.teachers = [];
        this.moments = [];  // 留言动态
        this.photos = [];   // 照片墙
        this.currentProvince = null;
        this.chart = null;
    }
    
    /**
     * 异步初始化应用
     */
    async init() {
        // 显示加载状态
        this.showLoading();
        
        // 并行加载地图、同学、老师数据和加密图片
        await Promise.all([
            this.loadMapData(),
            this.loadData(),
            this.loadTeachers(),
            this.loadEncryptedImages(),
            this.loadMomentsFromServer()
        ]);
        
        // 初始化地图
        this.initMap();
        
        // 数据加载完成后初始化其他功能
        this.bindEvents();
        this.updateStats();
        this.renderClassmatesList();
        this.renderTeachersList();
        this.renderMoments();
        this.renderPhotos();
        this.populateFilters();
        this.initPostMoment();
        
        // 隐藏加载状态
        this.hideLoading();
    }
    
    /**
     * 加载动态数据
     */
    async loadMomentsFromServer() {
        try {
            this.moments = await loadMomentsData();
        } catch (error) {
            console.error('加载动态失败:', error);
            this.moments = [];
        }
    }
    
    /**
     * 加载加密的图片
     */
    async loadEncryptedImages() {
        try {
            // 加载同学照片
            window.decryptedPhotos = await loadEncryptedImages('data/encrypted-photos.json', SITE_PASSWORD);
            console.log(`成功加载 ${Object.keys(window.decryptedPhotos).length} 张同学照片`);
            
            // 加载照片墙图片
            window.decryptedGallery = await loadEncryptedImages('data/encrypted-gallery.json', SITE_PASSWORD);
            console.log(`成功加载 ${Object.keys(window.decryptedGallery).length} 张照片墙图片`);
        } catch (error) {
            console.error('加载加密图片失败:', error);
            window.decryptedPhotos = {};
            window.decryptedGallery = {};
        }
    }
    
    /**
     * 显示加载状态
     */
    showLoading() {
        const mapContainer = document.getElementById('china-map');
        if (mapContainer) {
            mapContainer.innerHTML = '<div class="loading"></div>';
        }
    }
    
    /**
     * 隐藏加载状态
     */
    hideLoading() {
        // 地图渲染后自动替换加载状态
    }
    
    /**
     * 加载地图数据
     */
    async loadMapData() {
        await loadChinaMap();
    }
    
    /**
     * 加载同学数据
     */
    async loadData() {
        try {
            this.classmates = await loadClassmatesData();
        } catch (error) {
            console.error('加载数据失败:', error);
            this.classmates = [];
        }
    }
    
    /**
     * 加载老师数据
     */
    async loadTeachers() {
        try {
            this.teachers = await loadTeachersData();
        } catch (error) {
            console.error('加载老师数据失败:', error);
            this.teachers = [];
        }
    }
    
    /**
     * 初始化 ECharts 中国地图
     */
    initMap() {
        const provinceCount = this.getProvinceCount();
        
        this.chart = initChinaMap('china-map', provinceCount, (provinceName) => {
            // 将全称转为简称以匹配数据
            const shortName = getShortProvinceName(provinceName);
            this.showProvinceDetail(shortName, provinceName);
        });
    }
    
    /**
     * 获取海外同学按国家统计
     */
    getOverseasCount() {
        const count = {};
        this.classmates.forEach(c => {
            if (this.isOverseas(c.province)) {
                count[c.province] = (count[c.province] || 0) + 1;
            }
        });
        return count;
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDetailPanel());
        }
        
        // 搜索和筛选
        const searchInput = document.getElementById('search-input');
        const provinceFilter = document.getElementById('province-filter');
        const industryFilter = document.getElementById('industry-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterClassmates());
        }
        if (provinceFilter) {
            provinceFilter.addEventListener('change', () => this.filterClassmates());
        }
        if (industryFilter) {
            industryFilter.addEventListener('change', () => this.filterClassmates());
        }
        
        // 标签切换（留言墙/照片墙）
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // 更新按钮状态
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新内容显示
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tab}-tab`).classList.add('active');
            });
        });
    }
    
    /**
     * 获取各省同学数量
     */
    getProvinceCount() {
        const count = {};
        this.classmates.forEach(c => {
            count[c.province] = (count[c.province] || 0) + 1;
        });
        return count;
    }
    
    /**
     * 显示省份详情
     */
    showProvinceDetail(shortName, fullName) {
        this.currentProvince = shortName;
        
        const provinceNameEl = document.getElementById('province-name');
        const detailContent = document.getElementById('detail-content');
        const closeBtn = document.getElementById('close-btn');
        
        // 获取该省份的同学（使用简称匹配）
        const provinceClassmates = this.classmates.filter(c => c.province === shortName);
        
        const displayName = fullName || shortName;
        provinceNameEl.textContent = `${displayName} (${provinceClassmates.length}人)`;
        closeBtn.style.display = 'block';
        
        if (provinceClassmates.length === 0) {
            detailContent.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-geo-alt"></i>
                    <p>暂无同学在${displayName}工作</p>
                </div>
            `;
        } else {
            detailContent.innerHTML = provinceClassmates.map(c => this.renderClassmateCard(c)).join('');
        }
    }
    
    /**
     * 渲染同学卡片
     */
    renderClassmateCard(classmate) {
        // 优先使用加密的照片，否则使用默认头像
        let avatar = this.getDefaultAvatar(classmate.name);
        if (classmate.photo) {
            const photoName = classmate.photo.replace(/\.[^/.]+$/, ''); // 移除扩展名
            const decryptedUrl = getDecryptedImageUrl(photoName, 'photos');
            if (decryptedUrl) {
                avatar = decryptedUrl;
            }
        }
        
        return `
            <div class="classmate-card">
                <div class="card-header">
                    <img src="${avatar}" alt="${classmate.name}" class="avatar" onerror="this.src='${this.getDefaultAvatar(classmate.name)}'">
                    <div class="card-title">
                        <div class="name">${classmate.name}</div>
                        <div class="location">
                            <i class="bi bi-geo-alt-fill"></i>
                            ${classmate.city || classmate.province}
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-item">
                        <i class="bi bi-building"></i>
                        <span>${classmate.company || '暂未填写'}</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-briefcase-fill"></i>
                        <span>${classmate.position || '暂未填写'}</span>
                    </div>
                    ${classmate.industry ? `
                        <div class="info-item">
                            <i class="bi bi-tag-fill"></i>
                            <span>${classmate.industry}</span>
                        </div>
                    ` : ''}
                    ${classmate.hometown ? `
                        <div class="info-item">
                            <i class="bi bi-house-heart-fill"></i>
                            <span>老家: ${classmate.hometown}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="contact-info">
                    ${classmate.phone ? `
                        <div class="info-item">
                            <i class="bi bi-telephone-fill"></i>
                            <span>${classmate.phone}</span>
                        </div>
                    ` : ''}
                    ${classmate.email ? `
                        <div class="info-item">
                            <i class="bi bi-envelope-fill"></i>
                            <span>${classmate.email}</span>
                        </div>
                    ` : ''}
                </div>
                ${classmate.message ? `
                    <div class="message">
                        <i class="bi bi-chat-quote-fill"></i> ${classmate.message}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * 获取默认头像（使用名字首字）
     */
    getDefaultAvatar(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff&size=60`;
    }
    
    /**
     * 关闭详情面板
     */
    closeDetailPanel() {
        document.querySelectorAll('.province').forEach(p => p.classList.remove('active'));
        
        const provinceNameEl = document.getElementById('province-name');
        const detailContent = document.getElementById('detail-content');
        const closeBtn = document.getElementById('close-btn');
        
        provinceNameEl.textContent = '欢迎来到523班纪念网站';
        closeBtn.style.display = 'none';
        
        detailContent.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🌟</div>
                <h3>十年相聚，共叙情谊</h3>
                <p>点击地图上的省份，查看在该地区工作生活的同学们~</p>
                <div class="stats-overview">
                    <div class="stat-item">
                        <span class="stat-number" id="stat-provinces">${this.getUniqueProvinces().length}</span>
                        <span class="stat-label">个省份</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="stat-classmates">${this.classmates.length}</span>
                        <span class="stat-label">位同学</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="stat-industries">${this.getUniqueIndustries().length}</span>
                        <span class="stat-label">个行业</span>
                    </div>
                </div>
            </div>
        `;
        
        this.currentProvince = null;
    }
    
    /**
     * 更新统计数据
     */
    updateStats() {
        const totalCount = document.getElementById('total-count');
        const statProvinces = document.getElementById('stat-provinces');
        const statClassmates = document.getElementById('stat-classmates');
        const statIndustries = document.getElementById('stat-industries');
        
        if (totalCount) totalCount.textContent = this.classmates.length;
        if (statProvinces) statProvinces.textContent = this.getUniqueProvinces().length;
        if (statClassmates) statClassmates.textContent = this.classmates.length;
        if (statIndustries) statIndustries.textContent = this.getUniqueIndustries().length;
        
        // 渲染海外同学
        this.renderOverseasClassmates();
    }
    
    /**
     * 判断是否为海外（排除"未知"和空值）
     */
    isOverseas(province) {
        if (!province || province === '未知' || province === '') {
            return false;
        }
        return !CHINA_PROVINCES.includes(province);
    }
    
    /**
     * 获取海外同学
     */
    getOverseasClassmates() {
        return this.classmates.filter(c => this.isOverseas(c.province));
    }
    
    /**
     * 渲染海外同学区域
     */
    renderOverseasClassmates() {
        const overseasList = document.getElementById('overseas-list');
        const overseasCount = document.getElementById('overseas-count');
        const overseasClassmates = this.getOverseasClassmates();
        
        if (!overseasList) return;
        
        if (overseasCount) {
            overseasCount.textContent = overseasClassmates.length;
        }
        
        if (overseasClassmates.length === 0) {
            overseasList.innerHTML = '<div class="overseas-empty">暂无海外同学信息</div>';
            return;
        }
        
        // 按国家/地区分组
        const countryGroups = {};
        overseasClassmates.forEach(c => {
            const country = c.province;
            if (!countryGroups[country]) {
                countryGroups[country] = [];
            }
            countryGroups[country].push(c);
        });
        
        // 渲染国家标签
        overseasList.innerHTML = Object.entries(countryGroups).map(([country, classmates]) => {
            const flag = COUNTRY_FLAGS[country] || '🌍';
            return `
                <div class="overseas-item" data-country="${country}">
                    <span class="country-flag">${flag}</span>
                    <span class="country-name">${country}</span>
                    <span class="country-count">${classmates.length}</span>
                </div>
            `;
        }).join('');
        
        // 绑定点击事件
        overseasList.querySelectorAll('.overseas-item').forEach(item => {
            item.addEventListener('click', () => {
                const country = item.dataset.country;
                this.showOverseasDetail(country);
            });
        });
    }
    
    /**
     * 显示海外同学详情
     */
    showOverseasDetail(country) {
        const provinceNameEl = document.getElementById('province-name');
        const detailContent = document.getElementById('detail-content');
        const closeBtn = document.getElementById('close-btn');
        
        const countryClassmates = this.classmates.filter(c => c.province === country);
        const flag = COUNTRY_FLAGS[country] || '🌍';
        
        provinceNameEl.textContent = `${flag} ${country} (${countryClassmates.length}人)`;
        closeBtn.style.display = 'block';
        
        detailContent.innerHTML = countryClassmates.map(c => this.renderClassmateCard(c)).join('');
    }
    
    /**
     * 获取唯一省份列表
     */
    getUniqueProvinces() {
        return [...new Set(this.classmates.map(c => c.province))];
    }
    
    /**
     * 获取唯一行业列表
     */
    getUniqueIndustries() {
        return [...new Set(this.classmates.map(c => c.industry))];
    }
    
    /**
     * 渲染底部同学列表
     */
    renderClassmatesList(filteredList = null) {
        const grid = document.getElementById('classmates-grid');
        const list = filteredList || this.classmates;
        
        if (list.length === 0) {
            grid.innerHTML = `
                <div class="no-data" style="grid-column: 1/-1;">
                    <i class="bi bi-search"></i>
                    <p>没有找到匹配的同学</p>
                </div>
            `;
        } else {
            grid.innerHTML = list.map(c => this.renderClassmateCard(c)).join('');
        }
    }
    
    /**
     * 填充筛选器选项
     */
    populateFilters() {
        const provinceFilter = document.getElementById('province-filter');
        const industryFilter = document.getElementById('industry-filter');
        
        // 省份筛选
        const provinces = this.getUniqueProvinces().sort();
        provinces.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            provinceFilter.appendChild(option);
        });
        
        // 行业筛选
        const industries = this.getUniqueIndustries().sort();
        industries.forEach(i => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            industryFilter.appendChild(option);
        });
    }
    
    /**
     * 筛选同学
     */
    filterClassmates() {
        const searchValue = document.getElementById('search-input').value.toLowerCase();
        const provinceValue = document.getElementById('province-filter').value;
        const industryValue = document.getElementById('industry-filter').value;
        
        const filtered = this.classmates.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchValue) ||
                                  c.company.toLowerCase().includes(searchValue) ||
                                  c.position.toLowerCase().includes(searchValue);
            const matchesProvince = !provinceValue || c.province === provinceValue;
            const matchesIndustry = !industryValue || c.industry === industryValue;
            
            return matchesSearch && matchesProvince && matchesIndustry;
        });
        
        this.renderClassmatesList(filtered);
    }
    
    /**
     * 渲染老师列表
     */
    renderTeachersList() {
        const grid = document.getElementById('teachers-grid');
        if (!grid) return;
        
        if (this.teachers.length === 0) {
            grid.innerHTML = `
                <div class="no-data" style="grid-column: 1/-1;">
                    <i class="bi bi-mortarboard"></i>
                    <p>暂无老师信息</p>
                </div>
            `;
        } else {
            grid.innerHTML = this.teachers.map(t => this.renderTeacherCard(t)).join('');
        }
    }
    
    /**
     * 渲染老师卡片
     */
    renderTeacherCard(teacher) {
        // 给老师姓名加上"老师"尊称（如果名字本身不包含"老师"）
        const displayName = teacher.name.endsWith('老师') ? teacher.name : teacher.name + '老师';
        
        return `
            <div class="teacher-card">
                <div class="name">${displayName}</div>
                <div class="subject">${teacher.subject}</div>
                ${teacher.status ? `
                    <div class="status">
                        <i class="bi bi-info-circle"></i> ${teacher.status}
                    </div>
                ` : ''}
                ${teacher.phone ? `
                    <div class="info-item">
                        <i class="bi bi-telephone-fill"></i>
                        <span>${teacher.phone}</span>
                    </div>
                ` : ''}
                ${teacher.email ? `
                    <div class="info-item">
                        <i class="bi bi-envelope-fill"></i>
                        <span>${teacher.email}</span>
                    </div>
                ` : ''}
                ${teacher.message ? `
                    <div class="message">
                        <i class="bi bi-chat-quote-fill"></i> ${teacher.message}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * 加载留言和照片数据（示例数据）
     */
    loadMomentsData() {
        // 留言动态示例数据
        this.moments = [
            {
                id: 1,
                name: '张三',
                avatar: '',
                time: '2026-01-10',
                content: '十年光阴，转眼即逝。还记得当年一起在教室里奋斗的日子，希望这次聚会能见到大家！',
                images: []
            },
            {
                id: 2,
                name: '李四',
                avatar: '',
                time: '2026-01-08',
                content: '刚收到聚会通知，太激动了！已经开始期待和老同学们重逢了，大家都还好吗？',
                images: []
            },
            {
                id: 3,
                name: '王五',
                avatar: '',
                time: '2026-01-05',
                content: '翻出了当年的毕业照，满满的回忆啊！523班永远是我心中最温暖的集体。',
                images: []
            },
            {
                id: 4,
                name: '赵六',
                avatar: '',
                time: '2026-01-03',
                content: '祝523班的同学们新年快乐！期待聚会时一起举杯畅聊！',
                images: []
            },
            {
                id: 5,
                name: '陈七',
                avatar: '',
                time: '2025-12-28',
                content: '十年了，大家都成长了很多，各自在不同的领域发光发热，为523班骄傲！',
                images: []
            }
        ];
        
        // 照片墙示例数据
        this.photos = [
            {
                id: 1,
                src: 'image/gallery/graduation.jpg',
                title: '2016届毕业合影',
                date: '2016-06-15',
                author: '班主任'
            },
            {
                id: 2,
                src: 'image/gallery/classroom.jpg',
                title: '教室日常',
                date: '2015-10-20',
                author: '李四'
            },
            {
                id: 3,
                src: 'image/gallery/sports.jpg',
                title: '运动会',
                date: '2015-11-05',
                author: '王五'
            },
            {
                id: 4,
                src: 'image/gallery/trip.jpg',
                title: '秋游合照',
                date: '2015-09-18',
                author: '张三'
            },
            {
                id: 5,
                src: 'image/gallery/party.jpg',
                title: '元旦晚会',
                date: '2016-01-01',
                author: '赵六'
            },
            {
                id: 6,
                src: 'image/gallery/study.jpg',
                title: '晚自习',
                date: '2016-03-10',
                author: '陈七'
            }
        ];
    }
    
    /**
     * 渲染留言墙
     */
    renderMoments() {
        const grid = document.getElementById('messages-grid');
        if (!grid) return;
        
        // 获取所有动态（服务器 + 本地）
        const allMoments = getAllMoments();
        
        if (allMoments.length === 0) {
            grid.innerHTML = `
                <div class="no-data" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="bi bi-chat-dots" style="font-size: 3rem; color: #8b5cf6;"></i>
                    <p style="margin-top: 15px; color: #5b21b6;">暂无留言，快来发表第一条动态吧！</p>
                </div>
            `;
        } else {
            grid.innerHTML = allMoments.map(m => this.renderMessageCard(m)).join('');
        }
    }
    
    /**
     * 初始化发布动态功能（邮件方式）
     */
    initPostMoment() {
        const textarea = document.getElementById('moment-content');
        const charCount = document.getElementById('char-count');
        const postBtn = document.getElementById('post-moment-btn');
        const senderName = document.getElementById('sender-name');
        
        // 显示当前登录用户
        const user = getCurrentUser();
        if (user.name && senderName) {
            senderName.textContent = user.name;
        }
        
        // 字符计数
        if (textarea) {
            textarea.addEventListener('input', () => {
                charCount.textContent = textarea.value.length;
            });
        }
        
        // 发布动态（打开邮件客户端）
        if (postBtn) {
            postBtn.addEventListener('click', () => {
                this.postMomentByEmail();
            });
        }
        
        // 回车发送（Ctrl+Enter）
        if (textarea) {
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.postMomentByEmail();
                }
            });
        }
    }
    
    /**
     * 通过邮件发布动态
     */
    postMomentByEmail() {
        const textarea = document.getElementById('moment-content');
        const content = textarea.value.trim();
        
        if (!content) {
            alert('请输入留言内容');
            textarea.focus();
            return;
        }
        
        const user = getCurrentUser();
        const senderName = user.name || '匿名同学';
        const senderUsername = user.username || '未知';
        const today = new Date().toISOString().split('T')[0];
        
        // 构建邮件内容
        const subject = encodeURIComponent(`【523班动态投稿】来自 ${senderName} 的留言`);
        const body = encodeURIComponent(
`=== 523班动态投稿 ===

发送者姓名：${senderName}
发送者账号：${senderUsername}
发送时间：${today}

留言内容：
${content}

===========================
此邮件由523班纪念网站自动生成`
        );
        
        // 打开邮件客户端
        const mailtoLink = `mailto:libohao1998@gmail.com?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
        
        // 提示用户
        this.showToast('正在打开邮件客户端，请发送邮件完成投稿~');
        
        // 清空输入框
        textarea.value = '';
        document.getElementById('char-count').textContent = '0';
    }
    
    /**
     * 显示提示消息
     */
    showToast(message) {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${message}`;
        document.body.appendChild(toast);
        
        // 动画显示
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 3秒后移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    /**
     * 渲染留言卡片
     */
    renderMessageCard(moment) {
        // 尝试获取加密的头像
        let avatar = this.getDefaultAvatar(moment.name);
        if (moment.avatar) {
            const avatarName = moment.avatar.replace(/\.[^/.]+$/, '');
            const decryptedUrl = getDecryptedImageUrl(avatarName, 'photos');
            if (decryptedUrl) {
                avatar = decryptedUrl;
            }
        }
        
        // 处理留言中的图片（使用加密图片）
        let imagesHtml = '';
        if (moment.images && moment.images.length > 0) {
            const decryptedImages = moment.images.map(img => {
                const imgName = img.replace(/^.*\//, '').replace(/\.[^/.]+$/, '');
                return getDecryptedImageUrl(imgName, 'gallery') || img;
            });
            imagesHtml = `<div class="msg-images">${decryptedImages.map(img => `<img src="${img}" alt="图片">`).join('')}</div>`;
        }
        
        return `
            <div class="message-card">
                <div class="msg-header">
                    <img src="${avatar}" alt="${moment.name}" class="msg-avatar" onerror="this.src='${this.getDefaultAvatar(moment.name)}'">
                    <div class="msg-info">
                        <div class="msg-name">${moment.name}</div>
                        <div class="msg-time"><i class="bi bi-clock"></i> ${moment.time}</div>
                    </div>
                </div>
                <div class="msg-content">${moment.content}</div>
                ${imagesHtml}
            </div>
        `;
    }
    
    /**
     * 渲染照片墙
     */
    renderPhotos() {
        const grid = document.getElementById('photos-grid');
        if (!grid) return;
        
        if (this.photos.length === 0) {
            grid.innerHTML = `
                <div class="no-data" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="bi bi-images" style="font-size: 3rem; color: #8b5cf6;"></i>
                    <p style="margin-top: 15px; color: #5b21b6;">暂无照片，快来分享美好回忆吧！</p>
                </div>
            `;
        } else {
            grid.innerHTML = this.photos.map(p => this.renderPhotoCard(p)).join('');
        }
    }
    
    /**
     * 渲染照片卡片
     */
    renderPhotoCard(photo) {
        // 优先使用加密的照片，否则使用占位图
        const photoName = photo.src ? photo.src.replace(/^.*\//, '').replace(/\.[^/.]+$/, '') : `photo_${photo.id}`;
        let imageSrc = getDecryptedImageUrl(photoName, 'gallery');
        
        // 如果没有加密图片，使用占位图
        if (!imageSrc) {
            imageSrc = `https://picsum.photos/400/400?random=${photo.id}`;
        }
        
        return `
            <div class="photo-card">
                <img src="${imageSrc}" alt="${photo.title}">
                <div class="photo-overlay">
                    <div class="photo-title">${photo.title}</div>
                    <div class="photo-date"><i class="bi bi-calendar3"></i> ${photo.date}</div>
                </div>
            </div>
        `;
    }
}

/**
 * 多用户登录验证功能
 */
function initPasswordProtection() {
    const overlay = document.getElementById('password-overlay');
    const mainContent = document.getElementById('main-content');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');
    
    // 检查是否已经验证过（使用 sessionStorage）
    // 必须同时有认证状态和用户信息才算有效登录
    const isAuthenticated = sessionStorage.getItem('523_authenticated') === 'true';
    const hasUserInfo = sessionStorage.getItem('523_current_user') && sessionStorage.getItem('523_current_name');
    
    if (isAuthenticated && hasUserInfo) {
        // 恢复解密密码和当前用户
        setDecryptionPassword(SITE_PASSWORD);
        overlay.style.display = 'none';
        mainContent.style.display = 'block';
        return true;
    } else {
        // 清除可能的无效登录状态
        sessionStorage.removeItem('523_authenticated');
        sessionStorage.removeItem('523_current_user');
        sessionStorage.removeItem('523_current_name');
    }
    
    // 验证用户登录
    async function verifyLogin() {
        const username = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        
        if (!username) {
            passwordError.textContent = '请输入用户名';
            usernameInput.focus();
            shakeInput(usernameInput);
            return false;
        }
        
        if (!password) {
            passwordError.textContent = '请输入密码';
            passwordInput.focus();
            shakeInput(passwordInput);
            return false;
        }
        
        // 检查密码是否正确（初始密码为 523forever）
        if (password !== SITE_PASSWORD) {
            passwordError.textContent = '密码错误，请重试';
            passwordInput.value = '';
            passwordInput.focus();
            shakeInput(passwordInput);
            return false;
        }
        
        // 密码正确，设置解密密码
        setDecryptionPassword(password);
        
        // 临时加载数据验证用户名（同时检查同学和老师）
        try {
            const classmates = await loadClassmatesData();
            const teachers = await loadTeachersData();
            
            // 先在同学中查找
            let validUser = classmates.find(c => c.username === username);
            let userType = 'student';
            
            // 如果同学中没找到，在老师中查找
            if (!validUser) {
                validUser = teachers.find(t => t.username === username);
                userType = 'teacher';
            }
            
            if (!validUser) {
                passwordError.textContent = '用户名不存在，请检查拼音是否正确';
                usernameInput.value = '';
                usernameInput.focus();
                shakeInput(usernameInput);
                return false;
            }
            
            // 登录成功
            sessionStorage.setItem('523_authenticated', 'true');
            sessionStorage.setItem('523_current_user', username);
            sessionStorage.setItem('523_current_name', validUser.name);
            sessionStorage.setItem('523_user_type', userType);
            
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                overlay.style.display = 'none';
                mainContent.style.display = 'block';
                mainContent.style.opacity = '0';
                mainContent.style.transition = 'opacity 0.5s ease';
                
                setTimeout(() => {
                    mainContent.style.opacity = '1';
                }, 50);
            }, 500);
            
            return true;
        } catch (error) {
            console.error('验证失败:', error);
            passwordError.textContent = '验证失败，请重试';
            return false;
        }
    }
    
    // 抖动效果
    function shakeInput(input) {
        input.style.animation = 'shake 0.5s';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }
    
    // 绑定事件
    passwordSubmit.addEventListener('click', verifyLogin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyLogin();
        }
    });
    
    // 自动聚焦到用户名输入框
    usernameInput.focus();
    
    return false;
}

/**
 * 获取当前登录用户
 */
function getCurrentUser() {
    const name = sessionStorage.getItem('523_current_name');
    const userType = sessionStorage.getItem('523_user_type');
    
    // 如果是老师，显示名字时加上"老师"尊称
    let displayName = name;
    if (userType === 'teacher' && name && !name.endsWith('老师')) {
        displayName = name + '老师';
    }
    
    return {
        username: sessionStorage.getItem('523_current_user'),
        name: displayName,
        userType: userType
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 先验证密码
    const authenticated = initPasswordProtection();
    
    // 如果已验证，初始化应用
    if (authenticated || sessionStorage.getItem('523_authenticated') === 'true') {
        window.app = new ClassReunionApp();
        await window.app.init();
    } else {
        // 等待密码验证成功后再初始化
        const observer = new MutationObserver(async (mutations) => {
            const mainContent = document.getElementById('main-content');
            if (mainContent && mainContent.style.display !== 'none') {
                observer.disconnect();
                window.app = new ClassReunionApp();
                await window.app.init();
            }
        });
        
        observer.observe(document.getElementById('main-content'), {
            attributes: true,
            attributeFilter: ['style']
        });
    }
});
