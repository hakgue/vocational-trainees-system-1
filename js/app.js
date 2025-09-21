/**
 * منصة إدارة المتدربين - الملف الرئيسي
 * تطبيق ويب تقدمي (PWA) يعمل دون إنترنت
 */

class TraineeManagementApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.periodsConfig = {
            period1: { name: 'الفترة الأولى', startTime: '08:00', endTime: '12:00' },
            period2: { name: 'الفترة الثانية', startTime: '13:00', endTime: '17:00' }
        };
        
        // إعدادات التطبيق
        this.config = {
            theme: 'light',
            language: 'ar',
            autoSave: true,
            notifications: true,
            syncInterval: 300000 // 5 دقائق
        };
    }

    async init() {
        try {
            // عرض شاشة التحميل
            this.showLoadingScreen(true);
            
            // تهيئة قاعدة البيانات
            console.log('جاري تهيئة قاعدة البيانات...');
            const dbReady = await database.init();
            
            if (!dbReady) {
                throw new Error('فشل في تهيئة قاعدة البيانات');
            }
            
            // تحميل الإعدادات
            await this.loadSettings();
            
            // تهيئة أحداث التطبيق
            this.setupEventListeners();
            
            // تهيئة التنقل
            this.setupNavigation();
            
            // تحميل لوحة التحكم
            await this.loadDashboard();
            
            // إخفاء شاشة التحميل
            setTimeout(() => {
                this.showLoadingScreen(false);
            }, 1500);
            
            console.log('تم تحميل التطبيق بنجاح');
            
            // بدء مزامنة البيانات إذا كان متاحاً
            this.startAutoSync();
            
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            this.showError('خطأ في تحميل التطبيق. برجاء إعادة تحميل الصفحة.');
            this.showLoadingScreen(false);
        }
    }

    showLoadingScreen(show) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            if (show) {
                loadingScreen.classList.remove('hidden');
            } else {
                loadingScreen.classList.add('hidden');
            }
        }
    }

    async loadSettings() {
        try {
            const settings = await database.getAllSettings();
            this.config = { ...this.config, ...settings };
            
            // تطبيق الإعدادات
            if (settings.period1StartTime) {
                this.periodsConfig.period1.startTime = settings.period1StartTime;
                this.periodsConfig.period1.endTime = settings.period1EndTime;
            }
            if (settings.period2StartTime) {
                this.periodsConfig.period2.startTime = settings.period2StartTime;
                this.periodsConfig.period2.endTime = settings.period2EndTime;
            }
            
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات:', error);
        }
    }

    setupEventListeners() {
        // مراقبة حالة الاتصال
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('تم استعادة الاتصال بالإنترنت', 'success');
            this.syncPendingData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('لا يوجد اتصال بالإنترنت. سيتم حفظ البيانات محلياً', 'warning');
        });

        // الحفظ التلقائي عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            if (this.config.autoSave) {
                this.saveAllPendingData();
            }
        });

        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveAllPendingData();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.openSearch();
                        break;
                }
            }
        });

        // معالجة تحديثات Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    this.showNotification('تم تحديث التطبيق. لرؤية التحديثات، برجاء إعادة تحميل الصفحة.', 'info');
                }
            });
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    }

    async navigateToSection(sectionName) {
        try {
            // إخفاء جميع الأقسام
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            // تحديث التنقل
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

            // عرض القسم المطلوب
            let sectionElement = document.getElementById(`${sectionName}-section`);
            
            if (!sectionElement) {
                // إنشاء القسم إذا لم يكن موجوداً
                await this.createSection(sectionName);
                sectionElement = document.getElementById(`${sectionName}-section`);
            }

            if (sectionElement) {
                sectionElement.classList.add('active');
                this.currentSection = sectionName;
                
                // تحميل بيانات القسم
                await this.loadSectionData(sectionName);
            }
            
        } catch (error) {
            console.error('خطأ في التنقل:', error);
            this.showError('خطأ في تحميل القسم المطلوب');
        }
    }

    async createSection(sectionName) {
        const container = document.querySelector('.container-fluid');
        const sectionElement = document.createElement('section');
        sectionElement.id = `${sectionName}-section`;
        sectionElement.className = 'content-section';
        
        // تحميل محتوى القسم حسب النوع
        switch (sectionName) {
            case 'trainees':
                sectionElement.innerHTML = await this.getTraineesHTML();
                break;
            case 'attendance':
                sectionElement.innerHTML = await this.getAttendanceHTML();
                break;
            case 'evaluation':
                sectionElement.innerHTML = await this.getEvaluationHTML();
                break;
            case 'reports':
                sectionElement.innerHTML = await this.getReportsHTML();
                break;
            case 'settings':
                sectionElement.innerHTML = await this.getSettingsHTML();
                break;
            default:
                sectionElement.innerHTML = '<div class="alert alert-warning">القسم غير متاح</div>';
        }
        
        container.appendChild(sectionElement);
    }

    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'trainees':
                    if (window.traineesManager) {
                        await window.traineesManager.loadTrainees();
                    }
                    break;
                case 'attendance':
                    if (window.attendanceManager) {
                        await window.attendanceManager.loadTodayAttendance();
                    }
                    break;
                case 'evaluation':
                    if (window.evaluationManager) {
                        await window.evaluationManager.loadEvaluations();
                    }
                    break;
                case 'reports':
                    if (window.reportsManager) {
                        await window.reportsManager.loadReports();
                    }
                    break;
                case 'settings':
                    if (window.settingsManager) {
                        await window.settingsManager.loadSettings();
                    }
                    break;
            }
        } catch (error) {
            console.error(`خطأ في تحميل بيانات ${sectionName}:`, error);
        }
    }

    async loadDashboard() {
        try {
            // تحميل إحصائيات اليوم
            const today = new Date().toISOString().split('T')[0];
            const stats = await this.getTodayStatistics();
            
            // تحديث بطاقات الإحصائيات
            this.updateStatsCards(stats);
            
            // تحميل الرسوم البيانية
            await this.loadCharts();
            
            // تحميل الأنشطة الأخيرة
            await this.loadRecentActivities();
            
        } catch (error) {
            console.error('خطأ في تحميل لوحة التحكم:', error);
        }
    }

    async getTodayStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const trainees = await database.getAllTrainees();
        const todayAttendance = await database.getAttendanceByDate(today);
        
        const stats = {
            totalTrainees: trainees.length,
            todayAttendance: todayAttendance.filter(a => a.status === 'present').length,
            lateTrainees: todayAttendance.filter(a => a.status === 'late').length,
            absentTrainees: trainees.length - todayAttendance.length
        };
        
        return stats;
    }

    updateStatsCards(stats) {
        const elements = {
            totalTrainees: document.getElementById('totalTrainees'),
            todayAttendance: document.getElementById('todayAttendance'),
            lateTrainees: document.getElementById('lateTrainees'),
            absentTrainees: document.getElementById('absentTrainees')
        };
        
        Object.entries(elements).forEach(([key, element]) => {
            if (element && stats[key] !== undefined) {
                this.animateCounter(element, stats[key]);
            }
        });
    }

    animateCounter(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const increment = (targetValue - startValue) / 30;
        let currentValue = startValue;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if ((increment > 0 && currentValue >= targetValue) || 
                (increment < 0 && currentValue <= targetValue)) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 50);
    }

    async loadCharts() {
        // رسم بياني للحضور الشهري
        await this.loadAttendanceChart();
        
        // رسم بياني لتوزيع التخصصات
        await this.loadSpecialtyChart();
    }

    async loadAttendanceChart() {
        const canvas = document.getElementById('attendanceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // بيانات وهمية للعرض
        const data = {
            labels: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'],
            datasets: [{
                label: 'حاضر',
                data: [85, 88, 92, 87],
                borderColor: '#48bb78',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                fill: true
            }, {
                label: 'غائب',
                data: [15, 12, 8, 13],
                borderColor: '#f56565',
                backgroundColor: 'rgba(245, 101, 101, 0.1)',
                fill: true
            }]
        };
        
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    async loadSpecialtyChart() {
        const canvas = document.getElementById('specialtyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const trainees = await database.getAllTrainees();
        
        // تجميع المتدربين حسب التخصص
        const specialtyCount = {};
        trainees.forEach(trainee => {
            const branch = database.getBranchById(trainee.specialty);
            const name = branch ? branch.nameAr : trainee.specialty;
            specialtyCount[name] = (specialtyCount[name] || 0) + 1;
        });
        
        const data = {
            labels: Object.keys(specialtyCount),
            datasets: [{
                data: Object.values(specialtyCount),
                backgroundColor: [
                    '#4299e1', '#48bb78', '#ed8936', '#9f7aea',
                    '#f56565', '#38b2ac', '#ed64a6', '#ecc94b'
                ]
            }]
        };
        
        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    async loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;
        
        // أنشطة وهمية للعرض
        const activities = [
            {
                icon: 'fas fa-user-plus',
                title: 'تم تسجيل متدرب جديد',
                description: 'أحمد محمد - تخصص إعلام آلي',
                time: 'منذ 5 دقائق'
            },
            {
                icon: 'fas fa-chart-line',
                title: 'تم تحديث درجات التقييم',
                description: 'مادة البرمجة - المجموعة أ',
                time: 'منذ 10 دقائق'
            },
            {
                icon: 'fas fa-calendar-check',
                title: 'تم تسجيل حضور اليوم',
                description: '45 متدرب حاضر من أصل 50',
                time: 'منذ 30 دقيقة'
            }
        ];
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }

    // ==========================================
    // عمليات الإشعارات والرسائل
    // ==========================================

    showNotification(message, type = 'info', duration = 5000) {
        if (!this.config.notifications) return;
        
        // إزالة الإشعارات السابقة لتجنب التراكم
        const existingNotifications = document.querySelectorAll('.notification-toast');
        if (existingNotifications.length > 2) {
            existingNotifications[0].remove();
        }
        
        const notificationId = 'notification-' + Date.now();
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `alert notification-toast position-fixed shadow-lg border-0`;
        
        // تحديد الألوان والأيقونات المتطورة
        const styles = {
            'success': {
                bg: 'alert-success',
                icon: 'fas fa-check-circle text-success',
                border: '#28a745'
            },
            'error': {
                bg: 'alert-danger', 
                icon: 'fas fa-exclamation-circle text-danger',
                border: '#dc3545'
            },
            'warning': {
                bg: 'alert-warning',
                icon: 'fas fa-exclamation-triangle text-warning', 
                border: '#ffc107'
            },
            'info': {
                bg: 'alert-info',
                icon: 'fas fa-info-circle text-info',
                border: '#17a2b8'
            }
        };
        
        const style = styles[type] || styles['info'];
        notification.className += ` ${style.bg}`;
        
        notification.style.cssText = `
            top: 20px;
            left: 20px;
            z-index: 9999;
            min-width: 320px;
            max-width: 450px;
            opacity: 0;
            transform: translateX(-100%);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 12px;
            border-left: 4px solid ${style.border};
            backdrop-filter: blur(10px);
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="${style.icon} me-3 fs-4 flex-shrink-0" style="margin-top: 2px;"></i>
                <div class="flex-grow-1">
                    <div class="fw-semibold mb-1">${message}</div>
                    <small class="text-muted opacity-75">
                        <i class="fas fa-clock me-1"></i>
                        ${new Date().toLocaleTimeString('ar-DZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </small>
                </div>
                <button type="button" class="btn-close ms-2 flex-shrink-0" 
                        onclick="this.closest('.notification-toast').style.opacity='0'; this.closest('.notification-toast').style.transform='translateX(-100%)'; setTimeout(() => this.closest('.notification-toast')?.remove(), 300);"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // إظهار الإشعار بتأثير انيميشن
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 50);
        
        // إخفاء الإشعار تلقائياً
        if (duration > 0) {
            setTimeout(() => {
                const element = document.getElementById(notificationId);
                if (element) {
                    element.style.opacity = '0';
                    element.style.transform = 'translateX(-100%)';
                    setTimeout(() => {
                        if (document.getElementById(notificationId)) {
                            element.remove();
                        }
                    }, 400);
                }
            }, duration);
        }
        
        return notificationId;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // ==========================================
    // عمليات المزامنة
    // ==========================================

    startAutoSync() {
        if (this.config.syncInterval > 0) {
            setInterval(() => {
                if (this.isOnline) {
                    this.syncPendingData();
                }
            }, this.config.syncInterval);
        }
    }

    async syncPendingData() {
        if (this.syncQueue.length === 0) return;
        
        console.log('جاري مزامنة البيانات المعلقة...');
        
        const syncedItems = [];
        
        for (const item of this.syncQueue) {
            try {
                // تنفيذ عملية المزامنة
                await this.processSyncItem(item);
                syncedItems.push(item);
            } catch (error) {
                console.error('خطأ في مزامنة العنصر:', item, error);
            }
        }
        
        // إزالة العناصر المزامنة
        this.syncQueue = this.syncQueue.filter(item => !syncedItems.includes(item));
        
        if (syncedItems.length > 0) {
            this.showSuccess(`تم مزامنة ${syncedItems.length} عنصر بنجاح`);
        }
    }

    async processSyncItem(item) {
        // هنا يمكن إضافة لوجيك المزامنة مع الخادم عند الحاجة
        console.log('معالجة عنصر للمزامنة:', item);
    }

    addToSyncQueue(operation, data) {
        this.syncQueue.push({
            operation,
            data,
            timestamp: new Date().toISOString()
        });
    }

    async saveAllPendingData() {
        // حفظ جميع البيانات المعلقة
        console.log('حفظ جميع البيانات المعلقة...');
    }

    // ==========================================
    // النوافذ المنبثقة والحوارات
    // ==========================================

    async showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            // إنشاء modal للتأكيد
            const modalHTML = `
                <div class="modal fade" id="confirmModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" onclick="confirmResult(false)">إلغاء</button>
                                <button type="button" class="btn btn-danger" onclick="confirmResult(true)">تأكيد</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // إضافة المودال إلى الصفحة
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
            
            // وظيفة لإرجاع النتيجة
            window.confirmResult = (result) => {
                modal.hide();
                setTimeout(() => {
                    document.getElementById('confirmModal').remove();
                    delete window.confirmResult;
                }, 500);
                resolve(result);
            };
            
            modal.show();
        });
    }

    showAlertDialog(title, message, type = 'info') {
        const iconMap = {
            'success': 'fas fa-check-circle text-success',
            'warning': 'fas fa-exclamation-triangle text-warning',
            'error': 'fas fa-times-circle text-danger',
            'info': 'fas fa-info-circle text-info'
        };

        const modalHTML = `
            <div class="modal fade" id="alertModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="${iconMap[type]} me-2"></i>${title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">موافق</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // إزالة أي modal سابق
        const existingModal = document.getElementById('alertModal');
        if (existingModal) existingModal.remove();

        // إضافة المودال الجديد
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('alertModal'));
        modal.show();

        // تنظيف بعد الإغلاق
        document.getElementById('alertModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('alertModal').remove();
        });
    }

    showLoadingModal(message = 'جاري المعالجة...') {
        const modalHTML = `
            <div class="modal fade" id="loadingModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mb-0">${message}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // إزالة أي modal تحميل سابق
        const existingModal = document.getElementById('loadingModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();

        return modal;
    }

    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
                setTimeout(() => modal.remove(), 500);
            }
        }
    }

    // ==========================================
    // عمليات مساعدة
    // ==========================================

    openSearch() {
        // فتح نافذة البحث
        console.log('فتح البحث...');
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-DZ');
    }

    formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('ar-DZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getCurrentDateTime() {
        return new Date().toISOString();
    }

    // جلب HTML للأقسام (سيتم تنفيذها في ملفات منفصلة)
    async getTraineesHTML() {
        return '<div>قسم إدارة المتدربين</div>';
    }

    async getAttendanceHTML() {
        return '<div>قسم الحضور والغياب</div>';
    }

    async getEvaluationHTML() {
        return '<div>قسم التقييم والدرجات</div>';
    }

    async getReportsHTML() {
        return '<div>قسم التقارير</div>';
    }

    async getSettingsHTML() {
        return '<div>قسم الإعدادات</div>';
    }
}

// تهيئة التطبيق عند تحميل الصفحة
const app = new TraineeManagementApp();

// تصدير للاستخدام في ملفات أخرى
if (typeof window !== 'undefined') {
    window.app = app;
    
    // بدء التطبيق عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
}