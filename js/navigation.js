/**
* منصة إدارة المتدربين - إدارة التنقل (النسخة المحدثة)
* نظام التنقل والواجهة الرئيسية
*/
class NavigationManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.navigationHistory = [];
        this.sectionManagers = {};
        this.breadcrumb = [];
        // حفظ navLinks كخاصية للكلاس لاستخدامها في جميع الطرق
        this.navLinks = null;
    }

    async init() {
        this.setupNavigation();
        this.setupMobileNavigation();
        this.initializeSectionManagers();
        this.setupBreadcrumb();
        // تحميل القسم الافتراضي
        await this.navigateToSection('dashboard');
    }

    setupNavigation() {
        // إعداد أحداث التنقل للشريط الجانبي
        this.navLinks = document.querySelectorAll('[data-section]');
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });

        // إعداد أحداث الدروب داون
        this.setupDropdowns();
        // إعداد البحث السريع
        this.setupQuickSearch();
        // إعداد اختصارات لوحة المفاتيح
        this.setupKeyboardShortcuts();
    }

    setupMobileNavigation() {
        // إعداد التنقل للأجهزة المحمولة
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('show');
            });

            // إغلاق القائمة عند النقر على رابط في الأجهزة المحمولة
            // استخدام this.navLinks بدلاً من navLinks المحلي
            if (this.navLinks) {
                this.navLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        if (window.innerWidth < 992) {
                            navbarCollapse.classList.remove('show');
                        }
                    });
                });
            }
        }
    }

    setupDropdowns() {
        // إعداد القوائم المنسدلة
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdownMenu = dropdown.nextElementSibling;
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('show');
                }
            });
        });

        // إغلاق القوائم المنسدلة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                openDropdowns.forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    setupQuickSearch() {
        // إعداد البحث السريع
        const searchBtn = document.querySelector('[onclick*="openSearch"]');
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openQuickSearch();
            });
        }

        // اختصار البحث بـ Ctrl+F
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.openQuickSearch();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // اختصارات مع Alt
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToSection('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToSection('trainees');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToSection('attendance');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateToSection('evaluation');
                        break;
                    case '5':
                        e.preventDefault();
                        this.navigateToSection('reports');
                        break;
                    case '6':
                        e.preventDefault();
                        this.navigateToSection('settings');
                        break;
                }
            }

            // العودة للخلف مع Escape
            if (e.key === 'Escape') {
                this.goBack();
            }
        });
    }

    async initializeSectionManagers() {
        // تهيئة مدراء الأقسام المختلفة
        try {
            // لوحة التحكم
            if (window.DashboardManager) {
                this.sectionManagers.dashboard = window.dashboardManager || new DashboardManager();
                await this.sectionManagers.dashboard.init();
            }

            // إدارة المتدربين
            if (window.TraineesManager) {
                this.sectionManagers.trainees = window.traineesManager || new TraineesManager();
                await this.sectionManagers.trainees.init();
            }

            // إدارة الحضور
            if (window.AttendanceManager) {
                this.sectionManagers.attendance = window.attendanceManager || new AttendanceManager();
                await this.sectionManagers.attendance.init();
            }

            // إدارة التقييم
            if (window.EvaluationManager) {
                this.sectionManagers.evaluation = window.evaluationManager || new EvaluationManager();
                await this.sectionManagers.evaluation.init();
            }

            // إدارة التقارير
            if (window.ReportsManager) {
                this.sectionManagers.reports = window.reportsManager || new ReportsManager();
                await this.sectionManagers.reports.init();
            }

            // إدارة التقارير المتقدمة (الجديدة)
            if (window.AdvancedReportsManager) {
                this.sectionManagers.advancedReports = window.advancedReportsManager || new AdvancedReportsManager();
                await this.sectionManagers.advancedReports.init();
                // استخدام التقارير المتقدمة كـ manager افتراضي للتقارير
                this.sectionManagers.reports = this.sectionManagers.advancedReports;
            }

            // إدارة الإعدادات
            if (window.SettingsManager) {
                this.sectionManagers.settings = window.settingsManager || new SettingsManager();
                await this.sectionManagers.settings.init();
            }

        } catch (error) {
            console.error('خطأ في تهيئة مدراء الأقسام:', error);
        }
    }

    setupBreadcrumb() {
        // إعداد مسار التنقل
        const breadcrumbContainer = document.querySelector('.breadcrumb');
        if (!breadcrumbContainer) {
            // إنشاء حاوية مسار التنقل إذا لم تكن موجودة
            const mainContent = document.querySelector('.main-content .container-fluid');
            if (mainContent) {
                const breadcrumbHtml = `
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb" id="navigationBreadcrumb">
                            <li class="breadcrumb-item">
                                <a href="#" onclick="navigationManager.navigateToSection('dashboard')">الرئيسية</a>
                            </li>
                            <li class="breadcrumb-item active" id="currentPageBreadcrumb">لوحة التحكم</li>
                        </ol>
                    </nav>
                `;
                mainContent.insertAdjacentHTML('afterbegin', breadcrumbHtml);
            }
        }
    }

    async navigateToSection(sectionName, options = {}) {
        try {
            // التحقق من صحة القسم
            if (!this.isValidSection(sectionName)) {
                throw new Error(`قسم غير صحيح: ${sectionName}`);
            }

            // إضافة إلى تاريخ التنقل
            if (this.currentSection && this.currentSection !== sectionName) {
                this.navigationHistory.push(this.currentSection);
            }

            // إخفاء جميع الأقسام
            this.hideAllSections();

            // إزالة الفئة النشطة من جميع روابط التنقل
            this.updateNavigationState(sectionName);

            // عرض القسم المطلوب
            const sectionElement = await this.ensureSectionExists(sectionName);
            if (sectionElement) {
                sectionElement.classList.add('active');
                this.currentSection = sectionName;

                // تحديث مسار التنقل
                this.updateBreadcrumb(sectionName);

                // تحميل بيانات القسم
                await this.loadSectionData(sectionName, options);

                // تحديث عنوان الصفحة
                this.updatePageTitle(sectionName);

                // تسجيل النشاط
                this.logNavigation(sectionName);
            }

        } catch (error) {
            console.error('خطأ في التنقل:', error);
            if (window.app && typeof window.app.showError === 'function') {
                window.app.showError(`خطأ في تحميل القسم: ${this.getSectionDisplayName(sectionName)}`);
            } else {
                alert(`خطأ في تحميل القسم: ${this.getSectionDisplayName(sectionName)}`);
            }
        }
    }

    isValidSection(sectionName) {
        const validSections = ['dashboard', 'trainees', 'attendance', 'evaluation', 'reports', 'settings'];
        return validSections.includes(sectionName);
    }

    hideAllSections() {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
    }

    updateNavigationState(activeSectionName) {
        // إزالة الفئة النشطة من جميع الروابط
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // إضافة الفئة النشطة للرابط المحدد
        const activeLink = document.querySelector(`[data-section="${activeSectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async ensureSectionExists(sectionName) {
        let sectionElement = document.getElementById(`${sectionName}-section`);
        if (!sectionElement) {
            // إنشاء القسم إذا لم يكن موجوداً
            sectionElement = await this.createSection(sectionName);
        }
        return sectionElement;
    }

    async createSection(sectionName) {
        const container = document.querySelector('.main-content .container-fluid');
        if (!container) return null;

        const sectionElement = document.createElement('section');
        sectionElement.id = `${sectionName}-section`;
        sectionElement.className = 'content-section';

        // محتوى أساسي للقسم
        sectionElement.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-3">جاري تحميل ${this.getSectionDisplayName(sectionName)}...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(sectionElement);

        // تحميل محتوى القسم من المدير المختص
        const manager = this.sectionManagers[sectionName];
        if (manager && typeof manager.createSection === 'function') {
            await manager.createSection();
        }

        return sectionElement;
    }

    async loadSectionData(sectionName, options) {
        const manager = this.sectionManagers[sectionName];
        if (manager) {
            try {
                // استدعاء دالة تحميل البيانات الخاصة بكل مدير
                if (typeof manager.loadData === 'function') {
                    await manager.loadData(options);
                } else if (typeof manager.loadSectionData === 'function') {
                    await manager.loadSectionData(options);
                }
            } catch (error) {
                console.error(`خطأ في تحميل بيانات ${sectionName}:`, error);
            }
        }
    }

    updateBreadcrumb(sectionName) {
        const breadcrumb = document.getElementById('navigationBreadcrumb');
        const currentPage = document.getElementById('currentPageBreadcrumb');
        
        if (breadcrumb && currentPage) {
            currentPage.textContent = this.getSectionDisplayName(sectionName);
            
            // إضافة روابط إضافية للأقسام الفرعية إذا لزم الأمر
            if (this.navigationHistory.length > 0) {
                const parentSection = this.navigationHistory[this.navigationHistory.length - 1];
                // يمكن إضافة منطق لإظهار المسار الكامل
            }
        }
    }

    updatePageTitle(sectionName) {
        const sectionDisplayName = this.getSectionDisplayName(sectionName);
        document.title = `${sectionDisplayName} - منصة إدارة المتدربين`;
    }

    getSectionDisplayName(sectionName) {
        const sectionNames = {
            dashboard: 'لوحة التحكم',
            trainees: 'إدارة المتدربين',
            attendance: 'الحضور والغياب',
            evaluation: 'التقييم والدرجات',
            reports: 'التقارير',
            settings: 'الإعدادات'
        };
        return sectionNames[sectionName] || sectionName;
    }

    logNavigation(sectionName) {
        // تسجيل النشاط للمراجعة والتحليل
        const navigationLog = {
            section: sectionName,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: this.navigationHistory[this.navigationHistory.length - 1] || 'direct'
        };
        
        // يمكن حفظ هذا في LocalStorage أو إرساله للخادم
        console.log('Navigation:', navigationLog);
    }

    goBack() {
        if (this.navigationHistory.length > 0) {
            const previousSection = this.navigationHistory.pop();
            this.navigateToSection(previousSection);
        }
    }

    openQuickSearch() {
        // إنشاء نافذة البحث السريع
        const searchModal = this.createQuickSearchModal();
        searchModal.show();
    }

    createQuickSearchModal() {
        // إزالة النافذة السابقة إذا كانت موجودة
        const existingModal = document.getElementById('quickSearchModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="quickSearchModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">البحث السريع</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" id="quickSearchInput" 
                                       placeholder="ابحث في المتدربين، المواد، الإعدادات..."
                                       oninput="navigationManager.performQuickSearch(this.value)">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                            </div>
                            <div id="quickSearchResults"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // التركيز على حقل البحث عند فتح النافذة
        const modal = new bootstrap.Modal(document.getElementById('quickSearchModal'));
        document.getElementById('quickSearchModal').addEventListener('shown.bs.modal', () => {
            document.getElementById('quickSearchInput').focus();
        });
        
        return modal;
    }

    async performQuickSearch(query) {
        const resultsContainer = document.getElementById('quickSearchResults');
        if (!resultsContainer) return;

        if (query.trim().length < 2) {
            resultsContainer.innerHTML = `
                <div class="text-muted text-center py-3">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>اكتب 2 حرف على الأقل للبدء في البحث</p>
                </div>
            `;
            return;
        }

        try {
            // عرض مؤشر التحميل
            resultsContainer.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري البحث...</span>
                    </div>
                    <p class="mt-2">جاري البحث...</p>
                </div>
            `;

            // البحث في قواعد البيانات المختلفة
            const results = await this.searchAllData(query);
            
            // عرض النتائج
            this.displaySearchResults(results);

        } catch (error) {
            console.error('خطأ في البحث:', error);
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.
                </div>
            `;
        }
    }

    async searchAllData(query) {
        const results = {
            trainees: [],
            subjects: [],
            reports: [],
            settings: []
        };

        const searchTerm = query.toLowerCase().trim();

        try {
            // البحث في المتدربين (إذا كانت قاعدة البيانات متوفرة)
            if (window.database && typeof window.database.getAllTrainees === 'function') {
                const trainees = await window.database.getAllTrainees();
                results.trainees = trainees.filter(trainee => 
                    trainee.fullName.toLowerCase().includes(searchTerm) ||
                    trainee.registrationNumber.toLowerCase().includes(searchTerm) ||
                    trainee.email?.toLowerCase().includes(searchTerm)
                ).slice(0, 5);
            }

            // البحث في المواد
            if (window.database && typeof window.database.getAllSubjects === 'function') {
                const subjects = await window.database.getAllSubjects();
                results.subjects = subjects.filter(subject => 
                    subject.name.toLowerCase().includes(searchTerm) ||
                    subject.code?.toLowerCase().includes(searchTerm)
                ).slice(0, 5);
            }

            // البحث في الإعدادات
            const settingsKeys = Object.keys(this.sectionManagers.settings?.currentSettings || {});
            results.settings = settingsKeys.filter(key => 
                key.toLowerCase().includes(searchTerm) ||
                this.translateSettingKey(key).toLowerCase().includes(searchTerm)
            ).slice(0, 3);

        } catch (error) {
            console.error('خطأ في البحث في البيانات:', error);
        }

        return results;
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('quickSearchResults');
        if (!resultsContainer) return;

        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

        if (totalResults === 0) {
            resultsContainer.innerHTML = `
                <div class="text-muted text-center py-4">
                    <i class="fas fa-search-minus fa-2x mb-2"></i>
                    <p>لم يتم العثور على نتائج</p>
                </div>
            `;
            return;
        }

        let html = '';

        // نتائج المتدربين
        if (results.trainees.length > 0) {
            html += `
                <div class="mb-3">
                    <h6 class="text-primary mb-2">
                        <i class="fas fa-users"></i> المتدربين (${results.trainees.length})
                    </h6>
                    <div class="list-group">
                        ${results.trainees.map(trainee => `
                            <a href="#" class="list-group-item list-group-item-action" 
                               onclick="navigationManager.navigateToTrainee('${trainee.id}')">
                                <div class="d-flex align-items-center">
                                    <div class="avatar me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                        ${trainee.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h6 class="mb-1">${trainee.fullName}</h6>
                                        <small class="text-muted">${trainee.registrationNumber}</small>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // نتائج المواد
        if (results.subjects.length > 0) {
            html += `
                <div class="mb-3">
                    <h6 class="text-success mb-2">
                        <i class="fas fa-book"></i> المواد (${results.subjects.length})
                    </h6>
                    <div class="list-group">
                        ${results.subjects.map(subject => `
                            <a href="#" class="list-group-item list-group-item-action" 
                               onclick="navigationManager.navigateToSubject('${subject.id}')">
                                <div class="d-flex justify-content-between">
                                    <h6 class="mb-1">${subject.name}</h6>
                                    <small class="text-muted">${subject.code || 'بدون رمز'}</small>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        resultsContainer.innerHTML = html;
    }

    navigateToTrainee(traineeId) {
        // إغلاق نافذة البحث والانتقال إلى صفحة المتدرب
        if (window.bootstrap && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('quickSearchModal'));
            if (modal) modal.hide();
        }
        this.navigateToSection('trainees', { traineeId });
    }

    navigateToSubject(subjectId) {
        // إغلاق نافذة البحث والانتقال إلى صفحة المادة
        if (window.bootstrap && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('quickSearchModal'));
            if (modal) modal.hide();
        }
        this.navigateToSection('evaluation', { subjectId });
    }

    translateSettingKey(key) {
        const translations = {
            institutionName: 'اسم المؤسسة',
            academicYear: 'السنة الدراسية',
            gradeScale: 'السلم الدراسي',
            // إضافة المزيد من الترجمات حسب الحاجة
        };
        return translations[key] || key;
    }

    // دوال مساعدة للتنقل المتقدم
    refreshCurrentSection() {
        this.navigateToSection(this.currentSection);
    }

    getCurrentSection() {
        return this.currentSection;
    }

    getNavigationHistory() {
        return [...this.navigationHistory];
    }

    clearNavigationHistory() {
        this.navigationHistory = [];
    }
}

// تصدير الكلاس
if (typeof window !== 'undefined') {
    window.NavigationManager = NavigationManager;
    window.navigationManager = new NavigationManager();
}        
        // إعداد البحث السريع
        this.setupQuickSearch();
        
        // إعداد اختصارات لوحة المفاتيح
        this.setupKeyboardShortcuts();
    }

    setupMobileNavigation() {
        // إعداد التنقل للأجهزة المحمولة
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('show');
            });
            
            // إغلاق القائمة عند النقر على رابط في الأجهزة المحمولة
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 992) {
                        navbarCollapse.classList.remove('show');
                    }
                });
            });
        }
    }

    setupDropdowns() {
        // إعداد القوائم المنسدلة
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdownMenu = dropdown.nextElementSibling;
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('show');
                }
            });
        });

        // إغلاق القوائم المنسدلة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                openDropdowns.forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    setupQuickSearch() {
        // إعداد البحث السريع
        const searchBtn = document.querySelector('[onclick*="openSearch"]');
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openQuickSearch();
            });
        }

        // اختصار البحث بـ Ctrl+F
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.openQuickSearch();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // اختصارات مع Alt
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToSection('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToSection('trainees');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToSection('attendance');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateToSection('evaluation');
                        break;
                    case '5':
                        e.preventDefault();
                        this.navigateToSection('reports');
                        break;
                    case '6':
                        e.preventDefault();
                        this.navigateToSection('settings');
                        break;
                }
            }
            
            // العودة للخلف مع Backspace
            if (e.key === 'Escape') {
                this.goBack();
            }
        });
    }

    async initializeSectionManagers() {
        // تهيئة مدراء الأقسام المختلفة
        try {
            // لوحة التحكم
            if (window.DashboardManager) {
                this.sectionManagers.dashboard = window.dashboardManager || new DashboardManager();
                await this.sectionManagers.dashboard.init();
            }

            // إدارة المتدربين
            if (window.TraineesManager) {
                this.sectionManagers.trainees = window.traineesManager || new TraineesManager();
                await this.sectionManagers.trainees.init();
            }

            // إدارة الحضور
            if (window.AttendanceManager) {
                this.sectionManagers.attendance = window.attendanceManager || new AttendanceManager();
                await this.sectionManagers.attendance.init();
            }

            // إدارة التقييم
            if (window.EvaluationManager) {
                this.sectionManagers.evaluation = window.evaluationManager || new EvaluationManager();
                await this.sectionManagers.evaluation.init();
            }

            // إدارة التقارير
            if (window.ReportsManager) {
                this.sectionManagers.reports = window.reportsManager || new ReportsManager();
                await this.sectionManagers.reports.init();
            }

            // إدارة التقارير المتقدمة (الجديدة)
            if (window.AdvancedReportsManager) {
                this.sectionManagers.advancedReports = window.advancedReportsManager || new AdvancedReportsManager();
                await this.sectionManagers.advancedReports.init();
                
                // استخدام التقارير المتقدمة كـ manager افتراضي للتقارير
                this.sectionManagers.reports = this.sectionManagers.advancedReports;
            }

            // إدارة الإعدادات
            if (window.SettingsManager) {
                this.sectionManagers.settings = window.settingsManager || new SettingsManager();
                await this.sectionManagers.settings.init();
            }

        } catch (error) {
            console.error('خطأ في تهيئة مدراء الأقسام:', error);
        }
    }

    setupBreadcrumb() {
        // إعداد مسار التنقل
        const breadcrumbContainer = document.querySelector('.breadcrumb');
        if (!breadcrumbContainer) {
            // إنشاء حاوية مسار التنقل إذا لم تكن موجودة
            const mainContent = document.querySelector('.main-content .container-fluid');
            if (mainContent) {
                const breadcrumbHtml = `
                    <nav aria-label="breadcrumb" class="mb-3">
                        <ol class="breadcrumb bg-light rounded p-3" id="navigationBreadcrumb">
                            <li class="breadcrumb-item"><a href="#" onclick="navigationManager.navigateToSection('dashboard')">الرئيسية</a></li>
                            <li class="breadcrumb-item active" aria-current="page" id="currentPageBreadcrumb">لوحة التحكم</li>
                        </ol>
                    </nav>
                `;
                mainContent.insertAdjacentHTML('afterbegin', breadcrumbHtml);
            }
        }
    }

    async navigateToSection(sectionName, options = {}) {
        try {
            // التحقق من صحة القسم
            if (!this.isValidSection(sectionName)) {
                throw new Error(`قسم غير صحيح: ${sectionName}`);
            }

            // إضافة إلى تاريخ التنقل
            if (this.currentSection && this.currentSection !== sectionName) {
                this.navigationHistory.push(this.currentSection);
            }

            // إخفاء جميع الأقسام
            this.hideAllSections();

            // إزالة الفئة النشطة من جميع روابط التنقل
            this.updateNavigationState(sectionName);

            // عرض القسم المطلوب
            const sectionElement = await this.ensureSectionExists(sectionName);
            if (sectionElement) {
                sectionElement.classList.add('active');
                this.currentSection = sectionName;
                
                // تحديث مسار التنقل
                this.updateBreadcrumb(sectionName);
                
                // تحميل بيانات القسم
                await this.loadSectionData(sectionName, options);
                
                // تحديث عنوان الصفحة
                this.updatePageTitle(sectionName);
                
                // تسجيل النشاط
                this.logNavigation(sectionName);
            }
            
        } catch (error) {
            console.error('خطأ في التنقل:', error);
            app.showError(`خطأ في تحميل القسم: ${this.getSectionDisplayName(sectionName)}`);
        }
    }

    isValidSection(sectionName) {
        const validSections = ['dashboard', 'trainees', 'attendance', 'evaluation', 'reports', 'settings'];
        return validSections.includes(sectionName);
    }

    hideAllSections() {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
    }

    updateNavigationState(activeSectionName) {
        // إزالة الفئة النشطة من جميع الروابط
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // إضافة الفئة النشطة للرابط المحدد
        const activeLink = document.querySelector(`[data-section="${activeSectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async ensureSectionExists(sectionName) {
        let sectionElement = document.getElementById(`${sectionName}-section`);
        
        if (!sectionElement) {
            // إنشاء القسم إذا لم يكن موجوداً
            sectionElement = await this.createSection(sectionName);
        }
        
        return sectionElement;
    }

    async createSection(sectionName) {
        const container = document.querySelector('.main-content .container-fluid');
        if (!container) return null;

        const sectionElement = document.createElement('section');
        sectionElement.id = `${sectionName}-section`;
        sectionElement.className = 'content-section';
        
        // محتوى أساسي للقسم
        sectionElement.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
                <p class="text-muted">جاري تحميل ${this.getSectionDisplayName(sectionName)}...</p>
            </div>
        `;
        
        container.appendChild(sectionElement);
        
        // تحميل محتوى القسم من المدير المختص
        const manager = this.sectionManagers[sectionName];
        if (manager && typeof manager.createSection === 'function') {
            await manager.createSection();
        }
        
        return sectionElement;
    }

    async loadSectionData(sectionName, options) {
        const manager = this.sectionManagers[sectionName];
        if (manager) {
            try {
                // استدعاء دالة تحميل البيانات الخاصة بكل مدير
                if (typeof manager.loadData === 'function') {
                    await manager.loadData(options);
                } else if (typeof manager.loadSectionData === 'function') {
                    await manager.loadSectionData(options);
                }
            } catch (error) {
                console.error(`خطأ في تحميل بيانات ${sectionName}:`, error);
            }
        }
    }

    updateBreadcrumb(sectionName) {
        const breadcrumb = document.getElementById('navigationBreadcrumb');
        const currentPage = document.getElementById('currentPageBreadcrumb');
        
        if (breadcrumb && currentPage) {
            currentPage.textContent = this.getSectionDisplayName(sectionName);
            
            // إضافة روابط إضافية للأقسام الفرعية إذا لزم الأمر
            if (this.navigationHistory.length > 0) {
                const parentSection = this.navigationHistory[this.navigationHistory.length - 1];
                // يمكن إضافة منطق لإظهار المسار الكامل
            }
        }
    }

    updatePageTitle(sectionName) {
        const sectionDisplayName = this.getSectionDisplayName(sectionName);
        document.title = `${sectionDisplayName} - منصة إدارة المتدربين`;
    }

    getSectionDisplayName(sectionName) {
        const sectionNames = {
            dashboard: 'لوحة التحكم',
            trainees: 'إدارة المتدربين',
            attendance: 'الحضور والغياب',
            evaluation: 'التقييم والدرجات',
            reports: 'التقارير',
            settings: 'الإعدادات'
        };
        return sectionNames[sectionName] || sectionName;
    }

    logNavigation(sectionName) {
        // تسجيل النشاط للمراجعة والتحليل
        const navigationLog = {
            section: sectionName,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: this.navigationHistory[this.navigationHistory.length - 1] || 'direct'
        };
        
        // يمكن حفظ هذا في LocalStorage أو إرساله للخادم
        console.log('Navigation:', navigationLog);
    }

    goBack() {
        if (this.navigationHistory.length > 0) {
            const previousSection = this.navigationHistory.pop();
            this.navigateToSection(previousSection);
        }
    }

    openQuickSearch() {
        // إنشاء نافذة البحث السريع
        const searchModal = this.createQuickSearchModal();
        searchModal.show();
    }

    createQuickSearchModal() {
        // إزالة النافذة السابقة إذا كانت موجودة
        const existingModal = document.getElementById('quickSearchModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="quickSearchModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">البحث السريع</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group mb-3">
                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                                <input type="text" class="form-control" id="quickSearchInput" 
                                       placeholder="ابحث في المتدربين، المواد، التقارير..." 
                                       onkeyup="navigationManager.performQuickSearch(this.value)">
                            </div>
                            <div id="quickSearchResults">
                                <div class="text-center text-muted py-4">
                                    <i class="fas fa-search fa-2x mb-2"></i>
                                    <p>ابدأ بكتابة كلمة البحث</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('quickSearchModal'));
        
        // التركيز على حقل البحث عند فتح النافذة
        document.getElementById('quickSearchModal').addEventListener('shown.bs.modal', () => {
            document.getElementById('quickSearchInput').focus();
        });

        return modal;
    }

    async performQuickSearch(query) {
        const resultsContainer = document.getElementById('quickSearchResults');
        if (!resultsContainer) return;

        if (query.trim().length < 2) {
            resultsContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>ابدأ بكتابة كلمة البحث</p>
                </div>
            `;
            return;
        }

        try {
            // عرض مؤشر التحميل
            resultsContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary mb-2" role="status"></div>
                    <p class="text-muted">جاري البحث...</p>
                </div>
            `;

            // البحث في قواعد البيانات المختلفة
            const results = await this.searchAllData(query);
            
            // عرض النتائج
            this.displaySearchResults(results);

        } catch (error) {
            console.error('خطأ في البحث:', error);
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    خطأ في البحث. حاول مرة أخرى.
                </div>
            `;
        }
    }

    async searchAllData(query) {
        const results = {
            trainees: [],
            subjects: [],
            reports: [],
            settings: []
        };

        const searchTerm = query.toLowerCase().trim();

        try {
            // البحث في المتدربين
            const trainees = await database.getAllTrainees();
            results.trainees = trainees.filter(trainee =>
                trainee.fullName.toLowerCase().includes(searchTerm) ||
                trainee.registrationNumber.toLowerCase().includes(searchTerm) ||
                trainee.email?.toLowerCase().includes(searchTerm)
            ).slice(0, 5);

            // البحث في المواد
            const subjects = await database.getAllSubjects();
            results.subjects = subjects.filter(subject =>
                subject.name.toLowerCase().includes(searchTerm) ||
                subject.code?.toLowerCase().includes(searchTerm)
            ).slice(0, 5);

            // البحث في الإعدادات
            const settingsKeys = Object.keys(this.sectionManagers.settings?.currentSettings || {});
            results.settings = settingsKeys.filter(key =>
                key.toLowerCase().includes(searchTerm) ||
                this.translateSettingKey(key).toLowerCase().includes(searchTerm)
            ).slice(0, 3);

        } catch (error) {
            console.error('خطأ في البحث في البيانات:', error);
        }

        return results;
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('quickSearchResults');
        if (!resultsContainer) return;

        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

        if (totalResults === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>لم يتم العثور على نتائج</p>
                </div>
            `;
            return;
        }

        let html = '';

        // نتائج المتدربين
        if (results.trainees.length > 0) {
            html += `
                <div class="search-category mb-3">
                    <h6 class="text-primary"><i class="fas fa-users"></i> المتدربين (${results.trainees.length})</h6>
                    ${results.trainees.map(trainee => `
                        <div class="search-result-item" onclick="navigationManager.navigateToTrainee(${trainee.id})">
                            <div class="d-flex align-items-center">
                                <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                                    ${trainee.fullName.charAt(0)}
                                </div>
                                <div>
                                    <div class="fw-bold">${trainee.fullName}</div>
                                    <small class="text-muted">${trainee.registrationNumber}</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // نتائج المواد
        if (results.subjects.length > 0) {
            html += `
                <div class="search-category mb-3">
                    <h6 class="text-success"><i class="fas fa-book"></i> المواد (${results.subjects.length})</h6>
                    ${results.subjects.map(subject => `
                        <div class="search-result-item" onclick="navigationManager.navigateToSubject(${subject.id})">
                            <div>
                                <div class="fw-bold">${subject.name}</div>
                                <small class="text-muted">${subject.code || 'بدون رمز'}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        resultsContainer.innerHTML = html;
    }

    navigateToTrainee(traineeId) {
        // إغلاق نافذة البحث والانتقال إلى صفحة المتدرب
        bootstrap.Modal.getInstance(document.getElementById('quickSearchModal')).hide();
        this.navigateToSection('trainees', { traineeId });
    }

    navigateToSubject(subjectId) {
        // إغلاق نافذة البحث والانتقال إلى صفحة المادة
        bootstrap.Modal.getInstance(document.getElementById('quickSearchModal')).hide();
        this.navigateToSection('evaluation', { subjectId });
    }

    translateSettingKey(key) {
        const translations = {
            institutionName: 'اسم المؤسسة',
            academicYear: 'السنة الدراسية',
            gradeScale: 'السلم الدراسي',
            // إضافة المزيد من الترجمات حسب الحاجة
        };
        return translations[key] || key;
    }

    // دوال مساعدة للتنقل المتقدم
    refreshCurrentSection() {
        this.navigateToSection(this.currentSection);
    }

    getCurrentSection() {
        return this.currentSection;
    }

    getNavigationHistory() {
        return [...this.navigationHistory];
    }

    clearNavigationHistory() {
        this.navigationHistory = [];
    }
}

// تصدير الكلاس
if (typeof window !== 'undefined') {
    window.NavigationManager = NavigationManager;
    window.navigationManager = new NavigationManager();
}
