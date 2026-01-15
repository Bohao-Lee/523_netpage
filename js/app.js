/**
 * 523班高中毕业十周年纪念网站 - 主程序
 */

// 密码配置（实际使用中建议在服务端验证）
const SITE_PASSWORD = '523forever';

class ClassReunionApp {
    constructor() {
        this.classmates = [];
        this.teachers = [];
        this.currentProvince = null;
        this.chart = null;
    }
    
    /**
     * 异步初始化应用
     */
    async init() {
        // 显示加载状态
        this.showLoading();
        
        // 并行加载地图、同学和老师数据
        await Promise.all([
            this.loadMapData(),
            this.loadData(),
            this.loadTeachers()
        ]);
        
        // 初始化地图
        this.initMap();
        
        // 数据加载完成后初始化其他功能
        this.bindEvents();
        this.updateStats();
        this.renderClassmatesList();
        this.renderTeachersList();
        this.populateFilters();
        
        // 隐藏加载状态
        this.hideLoading();
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
        const avatar = classmate.avatar || this.getDefaultAvatar(classmate.name);
        
        return `
            <div class="classmate-card">
                <div class="name">
                    <span>${classmate.name}</span>
                </div>
                <div class="info-item">
                    <i class="bi bi-geo-alt-fill"></i>
                    <span>${classmate.city} · ${classmate.district}</span>
                </div>
                <div class="info-item">
                    <i class="bi bi-building"></i>
                    <span>${classmate.company}</span>
                </div>
                <div class="info-item">
                    <i class="bi bi-briefcase-fill"></i>
                    <span>${classmate.position}</span>
                </div>
                <div class="info-item">
                    <i class="bi bi-tag-fill"></i>
                    <span>${classmate.industry}</span>
                </div>
                ${classmate.hometown ? `
                    <div class="info-item">
                        <i class="bi bi-house-heart-fill"></i>
                        <span>老家: ${classmate.hometown}</span>
                    </div>
                ` : ''}
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
        return `
            <div class="teacher-card">
                <div class="name">${teacher.name}</div>
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
}

/**
 * 密码验证功能
 */
function initPasswordProtection() {
    const overlay = document.getElementById('password-overlay');
    const mainContent = document.getElementById('main-content');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');
    
    // 检查是否已经验证过（使用 sessionStorage）
    if (sessionStorage.getItem('523_authenticated') === 'true') {
        overlay.style.display = 'none';
        mainContent.style.display = 'block';
        return true;
    }
    
    // 验证密码
    function verifyPassword() {
        const password = passwordInput.value;
        
        if (password === SITE_PASSWORD) {
            // 密码正确
            sessionStorage.setItem('523_authenticated', 'true');
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
        } else {
            // 密码错误
            passwordError.textContent = '密码错误，请重试';
            passwordInput.value = '';
            passwordInput.focus();
            
            // 抖动效果
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
            
            return false;
        }
    }
    
    // 绑定事件
    passwordSubmit.addEventListener('click', verifyPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyPassword();
        }
    });
    
    // 自动聚焦
    passwordInput.focus();
    
    return false;
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
