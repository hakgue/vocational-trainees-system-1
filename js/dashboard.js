/**
 * منصة إدارة المتدربين - لوحة التحكم الرئيسية
 * عرض الإحصائيات والرسوم البيانية والأنشطة الأخيرة
 */

class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = 300000; // 5 دقائق
        this.autoRefreshTimer = null;
    }

    async init() {
        await this.loadDashboardData();
        this.initializeCharts();
        this.startAutoRefresh();
    }

    async loadDashboardData() {
        try {
            // تحميل الإحصائيات العامة
            await this.updateGeneralStats();
            
            // تحميل بيانات الرسوم البيانية
            await this.updateChartsData();
            
            // تحميل الأنشطة الأخيرة
            await this.loadRecentActivities();
            
        } catch (error) {
            console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
            app.showError('خطأ في تحميل لوحة التحكم');
        }
    }

    async updateGeneralStats() {
        const today = new Date().toISOString().split('T')[0];
        
        // جلب البيانات
        const trainees = await database.getAllTrainees();
        const todayAttendance = await database.getAttendanceByDate(today);
        
        // حساب الإحصائيات
        const stats = {
            totalTrainees: trainees.length,
            activeTrainees: trainees.filter(t => t.status === 'active').length,
            todayAttendance: todayAttendance.filter(a => a.status === 'present').length,
            lateTrainees: todayAttendance.filter(a => a.status === 'late').length,
            absentTrainees: trainees.filter(t => t.status === 'active').length - todayAttendance.length
        };
        
        // تحديث العرض
        this.animateStatsCards(stats);
        
        return stats;
    }

    animateStatsCards(stats) {
        const elements = {
            totalTrainees: document.getElementById('totalTrainees'),
            todayAttendance: document.getElementById('todayAttendance'),
            lateTrainees: document.getElementById('lateTrainees'),
            absentTrainees: document.getElementById('absentTrainees')
        };
        
        Object.entries(elements).forEach(([key, element]) => {
            if (element && stats[key] !== undefined) {
                app.animateCounter(element, stats[key]);
            }
        });
    }

    async updateChartsData() {
        // تحديث رسم الحضور الشهري
        await this.updateAttendanceChart();
        
        // تحديث رسم التخصصات
        await this.updateSpecialtyChart();
        
        // تحديث رسم الأداء الأكاديمي (إذا كان متاحاً)
        await this.updatePerformanceChart();
    }

    async updateAttendanceChart() {
        const canvas = document.getElementById('attendanceChart');
        if (!canvas) return;

        // جلب بيانات الحضور للشهر الحالي
        const attendanceData = await this.getMonthlyAttendanceData();
        
        // تدمير الرسم السابق إذا كان موجوداً
        if (this.charts.attendance) {
            this.charts.attendance.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        this.charts.attendance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: attendanceData.labels,
                datasets: [{
                    label: 'حاضر',
                    data: attendanceData.present,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'متأخر',
                    data: attendanceData.late,
                    borderColor: '#ed8936',
                    backgroundColor: 'rgba(237, 137, 54, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'غائب',
                    data: attendanceData.absent,
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        textDirection: 'rtl'
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }

    async getMonthlyAttendanceData() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const labels = [];
        const present = [];
        const late = [];
        const absent = [];
        
        // إنشاء تسميات الأيام
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('ar-DZ', { weekday: 'short', day: 'numeric' });
            labels.push(dayName);
            
            // جلب بيانات الحضور لهذا اليوم
            const dayAttendance = await database.getAttendanceByDate(dateStr);
            
            present.push(dayAttendance.filter(a => a.status === 'present').length);
            late.push(dayAttendance.filter(a => a.status === 'late').length);
            absent.push(dayAttendance.filter(a => a.status === 'absent').length);
        }
        
        return { labels, present, late, absent };
    }

    async updateSpecialtyChart() {
        const canvas = document.getElementById('specialtyChart');
        if (!canvas) return;

        const trainees = await database.getAllTrainees();
        
        // تجميع المتدربين حسب التخصص
        const specialtyCount = {};
        const colors = [
            '#4299e1', '#48bb78', '#ed8936', '#9f7aea',
            '#f56565', '#38b2ac', '#ed64a6', '#ecc94b',
            '#667eea', '#764ba2', '#f093fb', '#f5576c'
        ];
        
        trainees.forEach(trainee => {
            const branch = database.professionalBranches.find(b => b.id === trainee.specialty);
            const name = branch ? branch.nameAr : trainee.specialty;
            specialtyCount[name] = (specialtyCount[name] || 0) + 1;
        });

        // تدمير الرسم السابق
        if (this.charts.specialty) {
            this.charts.specialty.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        this.charts.specialty = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(specialtyCount),
                datasets: [{
                    data: Object.values(specialtyCount),
                    backgroundColor: colors.slice(0, Object.keys(specialtyCount).length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true,
                        textDirection: 'rtl',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    async updatePerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        // جلب بيانات الأداء (إذا كانت متاحة)
        const performanceData = await this.getPerformanceData();
        
        if (!performanceData || performanceData.length === 0) return;

        // تدمير الرسم السابق
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        this.charts.performance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: performanceData.labels,
                datasets: [{
                    label: 'معدل الأداء',
                    data: performanceData.scores,
                    backgroundColor: 'rgba(66, 153, 225, 0.6)',
                    borderColor: '#4299e1',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 20,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    async getPerformanceData() {
        try {
            // جلب درجات المتدربين وحساب المعدلات
            const grades = await database.getAllGrades();
            const trainees = await database.getAllTrainees();
            
            if (grades.length === 0) return null;

            const traineePerformance = {};
            
            grades.forEach(grade => {
                if (!traineePerformance[grade.traineeId]) {
                    traineePerformance[grade.traineeId] = {
                        grades: [],
                        trainee: trainees.find(t => t.id === grade.traineeId)
                    };
                }
                traineePerformance[grade.traineeId].grades.push(grade.score);
            });

            const labels = [];
            const scores = [];

            Object.values(traineePerformance).forEach(item => {
                if (item.trainee && item.grades.length > 0) {
                    const average = item.grades.reduce((a, b) => a + b, 0) / item.grades.length;
                    labels.push(item.trainee.fullName.substring(0, 20));
                    scores.push(Math.round(average * 100) / 100);
                }
            });

            return { labels: labels.slice(0, 10), scores: scores.slice(0, 10) };
            
        } catch (error) {
            console.error('خطأ في جلب بيانات الأداء:', error);
            return null;
        }
    }

    async loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        try {
            const activities = await this.getRecentActivities();
            
            if (activities.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-history fa-2x text-muted mb-2"></i>
                        <p class="text-muted">لا توجد أنشطة حديثة</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = activities.map(activity => `
                <div class="activity-item animate-fade-in">
                    <div class="activity-icon bg-${activity.type}">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                    </div>
                    <div class="activity-time">${activity.timeAgo}</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('خطأ في تحميل الأنشطة الأخيرة:', error);
        }
    }

    async getRecentActivities() {
        const activities = [];
        
        try {
            // أنشطة المتدربين
            const trainees = await database.getAllTrainees();
            const recentTrainees = trainees
                .filter(t => t.createdAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3);

            recentTrainees.forEach(trainee => {
                activities.push({
                    type: 'primary',
                    icon: 'fas fa-user-plus',
                    title: 'تم تسجيل متدرب جديد',
                    description: `${trainee.fullName} - ${this.getBranchName(trainee.specialty)}`,
                    timeAgo: this.getTimeAgo(trainee.createdAt),
                    timestamp: new Date(trainee.createdAt)
                });
            });

            // أنشطة الحضور
            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = await database.getAttendanceByDate(today);
            
            if (todayAttendance.length > 0) {
                const presentCount = todayAttendance.filter(a => a.status === 'present').length;
                activities.push({
                    type: 'success',
                    icon: 'fas fa-calendar-check',
                    title: 'تم تسجيل حضور اليوم',
                    description: `${presentCount} متدرب حاضر من أصل ${trainees.filter(t => t.status === 'active').length}`,
                    timeAgo: 'اليوم',
                    timestamp: new Date()
                });
            }

            // أنشطة الدرجات (إذا كانت متاحة)
            const recentGrades = await this.getRecentGrades();
            recentGrades.forEach(grade => {
                activities.push({
                    type: 'warning',
                    icon: 'fas fa-chart-line',
                    title: 'تم إضافة تقييم جديد',
                    description: `${grade.subjectName} - ${grade.evaluationType}`,
                    timeAgo: this.getTimeAgo(grade.createdAt),
                    timestamp: new Date(grade.createdAt)
                });
            });

            // ترتيب الأنشطة حسب التاريخ
            return activities
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);
                
        } catch (error) {
            console.error('خطأ في جلب الأنشطة:', error);
            return [];
        }
    }

    async getRecentGrades() {
        try {
            const grades = await database.getAllGrades();
            return grades
                .filter(g => g.createdAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 2);
        } catch (error) {
            return [];
        }
    }

    getBranchName(branchId) {
        const branch = database.professionalBranches.find(b => b.id === branchId);
        return branch ? branch.nameAr : branchId;
    }

    getTimeAgo(dateString) {
        if (!dateString) return 'غير محدد';
        
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        
        return date.toLocaleDateString('ar-DZ');
    }

    startAutoRefresh() {
        this.autoRefreshTimer = setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    }

    initializeCharts() {
        // تهيئة Chart.js للعربية
        Chart.defaults.font.family = 'Cairo, sans-serif';
        Chart.defaults.plugins.tooltip.rtl = true;
        Chart.defaults.plugins.tooltip.textDirection = 'rtl';
    }

    destroy() {
        // تدمير جميع الرسوم البيانية
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        
        this.stopAutoRefresh();
    }
}

// تصدير الكلاس
if (typeof window !== 'undefined') {
    window.DashboardManager = DashboardManager;
    window.dashboardManager = new DashboardManager();
}