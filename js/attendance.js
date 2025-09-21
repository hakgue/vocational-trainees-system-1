/**
 * منصة إدارة المتدربين - نظام الحضور والغياب المتقدم
 * نظام شامل لإدارة الحضور مع إحصائيات مباشرة ونظام تعديل مرن
 */

class AttendanceManager {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.currentSession = 'session1';
        this.attendanceData = [];
        this.trainees = [];
        this.filteredTrainees = [];
        this.scheduleConfig = {};
        this.statisticsCache = {};
        this.autoSaveTimer = null;
        this.lastModified = null;
        
        // فلاتر الحضور
        this.attendanceFilter = {
            specialty: '',
            group: '',
            status: '',
            attendanceStatus: '',
            dateRange: 'today'
        };
        
        // حالات الحضور مع ألوان متطورة
        this.attendanceStates = {
            'present': {
                label: 'حاضر',
                icon: 'fas fa-check',
                class: 'present',
                color: '#28a745',
                bgColor: '#d4edda',
                borderColor: '#c3e6cb',
                value: 1
            },
            'late': {
                label: 'متأخر',
                icon: 'fas fa-clock',
                class: 'late', 
                color: '#ffc107',
                bgColor: '#fff3cd',
                borderColor: '#ffeaa7',
                value: 0.5
            },
            'absent': {
                label: 'غائب',
                icon: 'fas fa-times',
                class: 'absent',
                color: '#dc3545',
                bgColor: '#f8d7da',
                borderColor: '#f5c6cb',
                value: 0
            }
        };
        
        // ترتيب دوران الحالات
        this.attendanceOrder = ['present', 'late', 'absent'];
        
        // معلومات الحصص (4 حصص يومياً)
        this.sessionsInfo = {
            session1: { period: 'period1', order: 1, name: 'الحصة الأولى', shortName: 'ح1' },
            session2: { period: 'period1', order: 2, name: 'الحصة الثانية', shortName: 'ح2' },
            session3: { period: 'period2', order: 3, name: 'الحصة الثالثة', shortName: 'ح3' },
            session4: { period: 'period2', order: 4, name: 'الحصة الرابعة', shortName: 'ح4' }
        };

        // إعدادات العرض
        this.viewSettings = {
            showStatistics: true,
            autoSave: true,
            showAttendancePercentage: true,
            highlightAbsent: true,
            compactView: false,
            showSessionTimes: true
        };

        // إحصائيات مباشرة
        this.liveStats = {
            totalTrainees: 0,
            presentToday: 0,
            absentToday: 0,
            lateToday: 0,
            attendanceRate: 0
        };
    }

    async init() {
        try {
            console.log('🎯 تهيئة نظام الحضور المتقدم...');
            
            // تحميل إعدادات الجدول الزمني
            await this.loadScheduleConfig();
            
            // إنشاء واجهة الحضور
            await this.createAttendanceInterface();
            
            // تحميل بيانات المتدربين
            await this.loadTrainees();
            
            // تحميل بيانات الحضور اليوم
            await this.loadTodayAttendance();
            
            // إعداد أحداث الواجهة
            this.setupEventListeners();
            
            // تحديث الإحصائيات المباشرة
            this.updateLiveStatistics();
            
            // بدء الحفظ التلقائي
            this.startAutoSave();
            
            console.log('✅ تم تهيئة نظام الحضور بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة نظام الحضور:', error);
            app.showNotification('خطأ في تحميل نظام الحضور', 'error');
        }
    }

    async loadScheduleConfig() {
        try {
            this.scheduleConfig = await database.getScheduleConfig();
            console.log('📅 تم تحميل إعدادات الجدول الزمني');
        } catch (error) {
            console.error('خطأ في تحميل إعدادات الجدول:', error);
            // استخدام إعدادات افتراضية
            this.scheduleConfig = {
                session1StartTime: '08:00',
                session1EndTime: '10:00',
                session2StartTime: '10:15', 
                session2EndTime: '12:15',
                session3StartTime: '13:00',
                session3EndTime: '15:00',
                session4StartTime: '15:15',
                session4EndTime: '17:15'
            };
        }
    }

    async createAttendanceInterface() {
        const sectionElement = document.getElementById('attendance-section');
        if (!sectionElement) return;

        sectionElement.innerHTML = `
            <!-- رأس الصفحة -->
            <div class="page-header">
                <div class="row align-items-center">
                    <div class="col">
                        <h1 class="page-title">
                            <i class="fas fa-calendar-check text-primary"></i>
                            نظام الحضور والغياب
                        </h1>
                        <p class="page-subtitle">إدارة متقدمة للحضور مع إحصائيات مباشرة لكل حصة منفردة</p>
                    </div>
                    <div class="col-auto">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-primary" onclick="attendanceManager.showAttendanceReport()">
                                <i class="fas fa-chart-bar"></i> التقارير
                            </button>
                            <button type="button" class="btn btn-outline-success" onclick="attendanceManager.exportAttendance()">
                                <i class="fas fa-download"></i> تصدير
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="attendanceManager.showSettings()">
                                <i class="fas fa-cog"></i> الإعدادات
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- شريط التحكم العلوي -->
            <div class="row mb-4">
                <!-- إعدادات التاريخ والحصة -->
                <div class="col-lg-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title text-primary">
                                <i class="fas fa-calendar-day me-2"></i>إعدادات العرض
                            </h6>
                            <div class="row g-3">
                                <div class="col-12">
                                    <label for="attendanceDate" class="form-label">التاريخ</label>
                                    <div class="input-group">
                                        <input type="date" class="form-control" id="attendanceDate" value="${this.currentDate}">
                                        <button class="btn btn-outline-primary" type="button" onclick="attendanceManager.setToday()">
                                            <i class="fas fa-calendar-day"></i> اليوم
                                        </button>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label for="currentSession" class="form-label">الحصة النشطة</label>
                                    <select class="form-select" id="currentSession">
                                        <option value="all">جميع الحصص</option>
                                        <option value="session1">الحصة الأولى (${this.scheduleConfig.session1StartTime || '08:00'} - ${this.scheduleConfig.session1EndTime || '10:00'})</option>
                                        <option value="session2">الحصة الثانية (${this.scheduleConfig.session2StartTime || '10:15'} - ${this.scheduleConfig.session2EndTime || '12:15'})</option>
                                        <option value="session3">الحصة الثالثة (${this.scheduleConfig.session3StartTime || '13:00'} - ${this.scheduleConfig.session3EndTime || '15:00'})</option>
                                        <option value="session4">الحصة الرابعة (${this.scheduleConfig.session4StartTime || '15:15'} - ${this.scheduleConfig.session4EndTime || '17:15'})</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- الإحصائيات المباشرة -->
                <div class="col-lg-8">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <div class="stat-card bg-primary text-white">
                                <div class="stat-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="totalTraineesCount">0</h3>
                                    <p>إجمالي المتدربين</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card bg-success text-white">
                                <div class="stat-icon">
                                    <i class="fas fa-user-check"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="presentCount">0</h3>
                                    <p>حاضر اليوم</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card bg-warning text-white">
                                <div class="stat-icon">
                                    <i class="fas fa-user-clock"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="lateCount">0</h3>
                                    <p>متأخر اليوم</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card bg-danger text-white">
                                <div class="stat-icon">
                                    <i class="fas fa-user-times"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="absentCount">0</h3>
                                    <p>غائب اليوم</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- شريط البحث والفلاتر -->
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                                <input type="text" class="form-control" id="searchAttendance" 
                                       placeholder="البحث عن متدرب...">
                            </div>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="filterSpecialty">
                                <option value="">جميع التخصصات</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="filterGroup">
                                <option value="">جميع المجموعات</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="filterAttendanceStatus">
                                <option value="">جميع الحالات</option>
                                <option value="present">حاضر</option>
                                <option value="late">متأخر</option>
                                <option value="absent">غائب</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <div class="btn-group w-100" role="group">
                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="attendanceManager.clearFilters()">
                                    <i class="fas fa-times"></i> مسح
                                </button>
                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="attendanceManager.showBulkActions()">
                                    <i class="fas fa-tasks"></i> مجمع
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- جدول الحضور الرئيسي -->
            <div class="card shadow-sm">
                <div class="card-header bg-light">
                    <div class="row align-items-center">
                        <div class="col">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-clipboard-list me-2"></i>
                                سجل الحضور - <span id="currentDateDisplay">${this.formatDate(this.currentDate)}</span>
                            </h5>
                        </div>
                        <div class="col-auto">
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn btn-outline-success" onclick="attendanceManager.markAllPresent()">
                                    <i class="fas fa-check-double"></i> الكل حاضر
                                </button>
                                <button type="button" class="btn btn-outline-warning" onclick="attendanceManager.markAllLate()">
                                    <i class="fas fa-clock"></i> الكل متأخر
                                </button>
                                <button type="button" class="btn btn-outline-danger" onclick="attendanceManager.markAllAbsent()">
                                    <i class="fas fa-times"></i> الكل غائب
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="attendanceManager.resetAllAttendance()">
                                    <i class="fas fa-undo"></i> إعادة تعيين
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <!-- مؤشر التحميل -->
                    <div id="attendanceLoading" class="text-center p-4" style="display: none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">جاري التحميل...</span>
                        </div>
                        <p class="mt-2">جاري تحميل بيانات الحضور...</p>
                    </div>

                    <!-- جدول الحضور -->
                    <div class="table-responsive" id="attendanceTableContainer">
                        <table class="table table-hover mb-0" id="attendanceTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th rowspan="2" class="align-middle" style="width: 60px;">
                                        <input type="checkbox" class="form-check-input" id="selectAll" onchange="attendanceManager.toggleSelectAll()">
                                    </th>
                                    <th rowspan="2" class="align-middle" style="width: 80px;">صورة</th>
                                    <th rowspan="2" class="align-middle" style="width: 120px;">رقم التسجيل</th>
                                    <th rowspan="2" class="align-middle">الاسم الكامل</th>
                                    <th rowspan="2" class="align-middle" style="width: 120px;">التخصص</th>
                                    <th rowspan="2" class="align-middle" style="width: 80px;">المجموعة</th>
                                    <th colspan="4" class="text-center">حضور الحصص</th>
                                    <th rowspan="2" class="align-middle" style="width: 100px;">معدل الحضور</th>
                                    <th rowspan="2" class="align-middle" style="width: 120px;">الإجراءات</th>
                                </tr>
                                <tr>
                                    <th class="text-center session-header" style="width: 100px;">
                                        الحصة الأولى<br>
                                        <small class="text-muted">${this.scheduleConfig.session1StartTime || '08:00'}-${this.scheduleConfig.session1EndTime || '10:00'}</small>
                                    </th>
                                    <th class="text-center session-header" style="width: 100px;">
                                        الحصة الثانية<br>
                                        <small class="text-muted">${this.scheduleConfig.session2StartTime || '10:15'}-${this.scheduleConfig.session2EndTime || '12:15'}</small>
                                    </th>
                                    <th class="text-center session-header" style="width: 100px;">
                                        الحصة الثالثة<br>
                                        <small class="text-muted">${this.scheduleConfig.session3StartTime || '13:00'}-${this.scheduleConfig.session3EndTime || '15:00'}</small>
                                    </th>
                                    <th class="text-center session-header" style="width: 100px;">
                                        الحصة الرابعة<br>
                                        <small class="text-muted">${this.scheduleConfig.session4StartTime || '15:15'}-${this.scheduleConfig.session4EndTime || '17:15'}</small>
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="attendanceTableBody">
                                <!-- سيتم ملء البيانات هنا ديناميكياً -->
                            </tbody>
                        </table>
                    </div>

                    <!-- رسالة عدم وجود بيانات -->
                    <div id="noAttendanceData" class="text-center p-5" style="display: none;">
                        <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">لا توجد بيانات حضور</h5>
                        <p class="text-muted">لا توجد متدربين مسجلين أو لا توجد بيانات للتاريخ المحدد</p>
                        <button type="button" class="btn btn-primary" onclick="navigationManager.navigateToSection('trainees')">
                            <i class="fas fa-plus me-2"></i>إضافة متدربين
                        </button>
                    </div>
                </div>

                <!-- تذييل الجدول -->
                <div class="card-footer">
                    <div class="row align-items-center">
                        <div class="col">
                            <small class="text-muted">
                                آخر تحديث: <span id="lastUpdateTime">لم يتم التحديث بعد</span>
                                | تم الحفظ: <span id="saveStatus" class="text-success">محفوظ</span>
                            </small>
                        </div>
                        <div class="col-auto">
                            <button type="button" class="btn btn-sm btn-outline-primary" onclick="attendanceManager.saveAllAttendance(true)">
                                <i class="fas fa-save"></i> حفظ الآن
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- النوافذ المنبثقة -->
            ${this.createAttendanceModals()}
        `;
    }

    createAttendanceModals() {
        return `
            <!-- نافذة التقارير -->
            <div class="modal fade" id="attendanceReportModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-chart-bar me-2"></i>تقارير الحضور والغياب
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="attendanceReportContent">
                                <!-- سيتم ملء المحتوى ديناميكياً -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- نافذة العمليات المجمعة -->
            <div class="modal fade" id="bulkActionsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">العمليات المجمعة</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">اختر الحصة:</label>
                                <select class="form-select" id="bulkActionSession">
                                    <option value="all">جميع الحصص</option>
                                    <option value="session1">الحصة الأولى</option>
                                    <option value="session2">الحصة الثانية</option>
                                    <option value="session3">الحصة الثالثة</option>
                                    <option value="session4">الحصة الرابعة</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">اختر الإجراء:</label>
                                <div class="btn-group-vertical w-100" role="group">
                                    <button type="button" class="btn btn-outline-success" onclick="attendanceManager.applyBulkAction('present')">
                                        <i class="fas fa-check me-2"></i>تحديد كحاضر
                                    </button>
                                    <button type="button" class="btn btn-outline-warning" onclick="attendanceManager.applyBulkAction('late')">
                                        <i class="fas fa-clock me-2"></i>تحديد كمتأخر
                                    </button>
                                    <button type="button" class="btn btn-outline-danger" onclick="attendanceManager.applyBulkAction('absent')">
                                        <i class="fas fa-times me-2"></i>تحديد كغائب
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- نافذة تفاصيل الحضور للمتدرب -->
            <div class="modal fade" id="traineeAttendanceModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="traineeAttendanceTitle">تفاصيل حضور المتدرب</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="traineeAttendanceDetails">
                                <!-- سيتم ملء المحتوى ديناميكياً -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadTrainees() {
        try {
            this.trainees = await database.getAllTrainees();
            this.applyFilters();
            console.log(`📚 تم تحميل ${this.trainees.length} متدرب`);
        } catch (error) {
            console.error('خطأ في تحميل المتدربين:', error);
            app.showNotification('خطأ في تحميل بيانات المتدربين', 'error');
        }
    }

    async loadTodayAttendance() {
        try {
            this.showLoading(true);
            this.attendanceData = await database.getAttendanceByDate(this.currentDate);
            this.renderAttendanceTable();
            this.updateLiveStatistics();
            this.showLoading(false);
            console.log(`📋 تم تحميل ${this.attendanceData.length} سجل حضور`);
        } catch (error) {
            console.error('خطأ في تحميل بيانات الحضور:', error);
            this.showLoading(false);
            app.showNotification('خطأ في تحميل بيانات الحضور', 'error');
        }
    }

    renderAttendanceTable() {
        const tbody = document.getElementById('attendanceTableBody');
        const noDataElement = document.getElementById('noAttendanceData');
        
        if (this.filteredTrainees.length === 0) {
            tbody.innerHTML = '';
            noDataElement.style.display = 'block';
            return;
        }
        
        noDataElement.style.display = 'none';
        
        tbody.innerHTML = this.filteredTrainees.map(trainee => {
            const traineeAttendance = this.getTraineeAttendanceForDate(trainee.id, this.currentDate);
            const attendanceRate = this.calculateAttendanceRate(trainee.id);
            
            return `
                <tr data-trainee-id="${trainee.id}" class="${this.getRowHighlightClass(traineeAttendance)}">
                    <td>
                        <input type="checkbox" class="form-check-input trainee-checkbox" value="${trainee.id}">
                    </td>
                    <td>
                        <div class="avatar-circle">
                            ${trainee.fullName.charAt(0)}
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-secondary">${trainee.registrationNumber}</span>
                    </td>
                    <td>
                        <div>
                            <strong>${trainee.fullName}</strong>
                            <br><small class="text-muted">${trainee.phone || 'لا يوجد هاتف'}</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-info">${this.getSpecialtyName(trainee.specialty)}</span>
                    </td>
                    <td>
                        <span class="badge bg-warning">${trainee.group}</span>
                    </td>
                    ${this.renderSessionButtons(trainee.id, traineeAttendance)}
                    <td class="text-center">
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar ${this.getProgressBarClass(attendanceRate)}" 
                                 style="width: ${attendanceRate}%" 
                                 title="${attendanceRate.toFixed(1)}%">
                                ${attendanceRate.toFixed(1)}%
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-info" 
                                    onclick="attendanceManager.showTraineeDetails(${trainee.id})" 
                                    title="تفاصيل الحضور">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" class="btn btn-outline-primary" 
                                    onclick="attendanceManager.editTraineeAttendance(${trainee.id})" 
                                    title="تعديل الحضور">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary" 
                                    onclick="attendanceManager.resetTraineeAttendance(${trainee.id})" 
                                    title="إعادة تعيين">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // تحديث وقت آخر تحديث
        this.updateLastModifiedTime();
    }

    renderSessionButtons(traineeId, attendanceData) {
        let buttonsHTML = '';
        
        Object.keys(this.sessionsInfo).forEach(sessionId => {
            const sessionAttendance = attendanceData.find(a => a.session === sessionId);
            const currentStatus = sessionAttendance ? sessionAttendance.status : 'absent';
            const stateInfo = this.attendanceStates[currentStatus];
            
            buttonsHTML += `
                <td class="text-center">
                    <button type="button" 
                            class="attendance-btn ${stateInfo.class}" 
                            data-trainee-id="${traineeId}" 
                            data-session="${sessionId}"
                            onclick="attendanceManager.toggleAttendance(${traineeId}, '${sessionId}')"
                            style="background-color: ${stateInfo.color}; border-color: ${stateInfo.borderColor};">
                        <i class="${stateInfo.icon} me-1"></i>
                        ${stateInfo.label}
                    </button>
                </td>
            `;
        });
        
        return buttonsHTML;
    }

    async toggleAttendance(traineeId, sessionId) {
        try {
            const currentAttendance = this.getTraineeSessionAttendance(traineeId, sessionId);
            const currentStatus = currentAttendance ? currentAttendance.status : 'absent';
            const currentIndex = this.attendanceOrder.indexOf(currentStatus);
            const nextIndex = (currentIndex + 1) % this.attendanceOrder.length;
            const newStatus = this.attendanceOrder[nextIndex];
            
            // تحديث البيانات
            await this.updateAttendanceRecord(traineeId, sessionId, newStatus);
            
            // تحديث الواجهة
            this.updateAttendanceButton(traineeId, sessionId, newStatus);
            
            // تحديث الإحصائيات
            this.updateLiveStatistics();
            
            // تشغيل الحفظ التلقائي
            this.triggerAutoSave();
            
            // تأثير بصري
            this.animateAttendanceChange(traineeId, sessionId, newStatus);
            
        } catch (error) {
            console.error('خطأ في تحديث الحضور:', error);
            app.showNotification('خطأ في تحديث الحضور', 'error');
        }
    }

    async updateAttendanceRecord(traineeId, sessionId, status) {
        const existingRecord = this.getTraineeSessionAttendance(traineeId, sessionId);
        
        const attendanceRecord = {
            traineeId: traineeId,
            date: this.currentDate,
            session: sessionId,
            period: this.sessionsInfo[sessionId].period,
            status: status,
            timestamp: new Date().toISOString(),
            modifiedBy: 'user', // يمكن تطوير نظام المستخدمين لاحقاً
            notes: ''
        };
        
        if (existingRecord) {
            // تحديث السجل الموجود
            await database.updateAttendance(existingRecord.id, attendanceRecord);
            
            // تحديث البيانات المحلية
            const index = this.attendanceData.findIndex(a => a.id === existingRecord.id);
            if (index !== -1) {
                this.attendanceData[index] = { ...existingRecord, ...attendanceRecord };
            }
        } else {
            // إضافة سجل جديد
            const newId = await database.addAttendance(attendanceRecord);
            attendanceRecord.id = newId;
            this.attendanceData.push(attendanceRecord);
        }
        
        console.log(`✅ تم تحديث حضور المتدرب ${traineeId} للحصة ${sessionId}: ${status}`);
    }

    updateAttendanceButton(traineeId, sessionId, status) {
        const button = document.querySelector(`[data-trainee-id="${traineeId}"][data-session="${sessionId}"]`);
        if (!button) return;
        
        const stateInfo = this.attendanceStates[status];
        
        // تحديث مظهر الزر
        button.className = `attendance-btn ${stateInfo.class}`;
        button.style.backgroundColor = stateInfo.color;
        button.style.borderColor = stateInfo.borderColor;
        button.innerHTML = `<i class="${stateInfo.icon} me-1"></i>${stateInfo.label}`;
        
        // تحديث معدل الحضور للمتدرب
        this.updateTraineeAttendanceRate(traineeId);
        
        // تحديث تلوين الصف
        this.updateRowHighlight(traineeId);
    }

    updateTraineeAttendanceRate(traineeId) {
        const rate = this.calculateAttendanceRate(traineeId);
        const progressBar = document.querySelector(`tr[data-trainee-id="${traineeId}"] .progress-bar`);
        
        if (progressBar) {
            progressBar.style.width = `${rate}%`;
            progressBar.textContent = `${rate.toFixed(1)}%`;
            progressBar.className = `progress-bar ${this.getProgressBarClass(rate)}`;
            progressBar.title = `${rate.toFixed(1)}%`;
        }
    }

    calculateAttendanceRate(traineeId) {
        const traineeAttendance = this.getTraineeAttendanceForDate(traineeId, this.currentDate);
        let totalValue = 0;
        let totalSessions = Object.keys(this.sessionsInfo).length;
        
        Object.keys(this.sessionsInfo).forEach(sessionId => {
            const sessionRecord = traineeAttendance.find(a => a.session === sessionId);
            const status = sessionRecord ? sessionRecord.status : 'absent';
            totalValue += this.attendanceStates[status].value;
        });
        
        return totalSessions > 0 ? (totalValue / totalSessions) * 100 : 0;
    }

    updateLiveStatistics() {
        const stats = this.calculateDailyStatistics();
        
        document.getElementById('totalTraineesCount').textContent = stats.total;
        document.getElementById('presentCount').textContent = stats.present;
        document.getElementById('lateCount').textContent = stats.late;
        document.getElementById('absentCount').textContent = stats.absent;
        
        this.liveStats = stats;
        
        // تحديث الرسم البياني إن وجد
        this.updateStatisticsChart();
    }

    calculateDailyStatistics() {
        const total = this.filteredTrainees.length;
        let present = 0, late = 0, absent = 0;
        
        this.filteredTrainees.forEach(trainee => {
            const attendance = this.getTraineeAttendanceForDate(trainee.id, this.currentDate);
            const dailyStatus = this.calculateDailyStatus(attendance);
            
            switch (dailyStatus) {
                case 'present':
                    present++;
                    break;
                case 'late':
                    late++;
                    break;
                case 'absent':
                    absent++;
                    break;
            }
        });
        
        return {
            total,
            present,
            late,
            absent,
            attendanceRate: total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : 0
        };
    }

    calculateDailyStatus(attendanceRecords) {
        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        
        Object.keys(this.sessionsInfo).forEach(sessionId => {
            const record = attendanceRecords.find(a => a.session === sessionId);
            const status = record ? record.status : 'absent';
            
            switch (status) {
                case 'present':
                    presentCount++;
                    break;
                case 'late':
                    lateCount++;
                    break;
                case 'absent':
                    absentCount++;
                    break;
            }
        });
        
        // تحديد الحالة الإجمالية لليوم
        if (presentCount >= 3) return 'present';
        if (presentCount + lateCount >= 2) return 'late';
        return 'absent';
    }

    // ==========================================
    // وظائف مساعدة
    // ==========================================

    getTraineeAttendanceForDate(traineeId, date) {
        return this.attendanceData.filter(a => 
            a.traineeId === traineeId && a.date === date
        );
    }

    getTraineeSessionAttendance(traineeId, sessionId) {
        return this.attendanceData.find(a => 
            a.traineeId === traineeId && 
            a.date === this.currentDate && 
            a.session === sessionId
        );
    }

    getSpecialtyName(specialtyId) {
        const branch = database.getBranchById(specialtyId);
        return branch ? branch.name : specialtyId;
    }

    getProgressBarClass(rate) {
        if (rate >= 80) return 'bg-success';
        if (rate >= 60) return 'bg-warning';
        return 'bg-danger';
    }

    getRowHighlightClass(attendanceRecords) {
        const dailyStatus = this.calculateDailyStatus(attendanceRecords);
        switch (dailyStatus) {
            case 'present':
                return 'table-success';
            case 'late':
                return 'table-warning';
            case 'absent':
                return 'table-danger';
            default:
                return '';
        }
    }

    updateRowHighlight(traineeId) {
        const row = document.querySelector(`tr[data-trainee-id="${traineeId}"]`);
        if (!row) return;
        
        const attendance = this.getTraineeAttendanceForDate(traineeId, this.currentDate);
        const highlightClass = this.getRowHighlightClass(attendance);
        
        // إزالة الكلاسات القديمة
        row.classList.remove('table-success', 'table-warning', 'table-danger');
        
        // إضافة الكلاس الجديد
        if (highlightClass) {
            row.classList.add(highlightClass);
        }
    }

    animateAttendanceChange(traineeId, sessionId, status) {
        const button = document.querySelector(`[data-trainee-id="${traineeId}"][data-session="${sessionId}"]`);
        if (!button) return;
        
        // تأثير الضغط
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        // تأثير التوهج
        button.style.boxShadow = `0 0 20px ${this.attendanceStates[status].color}`;
        setTimeout(() => {
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }, 500);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-DZ', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateLastModifiedTime() {
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = now.toLocaleTimeString('ar-DZ');
        this.lastModified = now;
    }

    showLoading(show) {
        const loading = document.getElementById('attendanceLoading');
        const table = document.getElementById('attendanceTableContainer');
        
        if (loading && table) {
            loading.style.display = show ? 'block' : 'none';
            table.style.display = show ? 'none' : 'block';
        }
    }

    // ==========================================
    // إعداد أحداث الواجهة
    // ==========================================

    setupEventListeners() {
        // تغيير التاريخ
        const dateInput = document.getElementById('attendanceDate');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.currentDate = e.target.value;
                this.loadTodayAttendance();
                document.getElementById('currentDateDisplay').textContent = this.formatDate(this.currentDate);
            });
        }

        // تغيير الحصة النشطة
        const sessionSelect = document.getElementById('currentSession');
        if (sessionSelect) {
            sessionSelect.addEventListener('change', (e) => {
                this.currentSession = e.target.value;
                this.highlightCurrentSession();
            });
        }

        // البحث
        const searchInput = document.getElementById('searchAttendance');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.attendanceFilter.search = e.target.value;
                this.applyFilters();
            });
        }

        // الفلاتر
        ['filterSpecialty', 'filterGroup', 'filterAttendanceStatus'].forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // تحديث الفلاتر
        this.populateFilterOptions();
    }

    populateFilterOptions() {
        // تحديث فلتر التخصصات
        const specialtyFilter = document.getElementById('filterSpecialty');
        if (specialtyFilter) {
            const specialties = [...new Set(this.trainees.map(t => t.specialty))];
            specialtyFilter.innerHTML = '<option value="">جميع التخصصات</option>' +
                specialties.map(specialty => 
                    `<option value="${specialty}">${this.getSpecialtyName(specialty)}</option>`
                ).join('');
        }

        // تحديث فلتر المجموعات
        const groupFilter = document.getElementById('filterGroup');
        if (groupFilter) {
            const groups = [...new Set(this.trainees.map(t => t.group).filter(g => g))];
            groupFilter.innerHTML = '<option value="">جميع المجموعات</option>' +
                groups.map(group => 
                    `<option value="${group}">${group}</option>`
                ).join('');
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchAttendance')?.value.toLowerCase() || '';
        const specialtyFilter = document.getElementById('filterSpecialty')?.value || '';
        const groupFilter = document.getElementById('filterGroup')?.value || '';
        const attendanceStatusFilter = document.getElementById('filterAttendanceStatus')?.value || '';

        this.filteredTrainees = this.trainees.filter(trainee => {
            const matchesSearch = !searchTerm || 
                trainee.fullName.toLowerCase().includes(searchTerm) ||
                trainee.registrationNumber.toLowerCase().includes(searchTerm);
            
            const matchesSpecialty = !specialtyFilter || trainee.specialty === specialtyFilter;
            const matchesGroup = !groupFilter || trainee.group === groupFilter;
            
            let matchesAttendanceStatus = true;
            if (attendanceStatusFilter) {
                const attendance = this.getTraineeAttendanceForDate(trainee.id, this.currentDate);
                const dailyStatus = this.calculateDailyStatus(attendance);
                matchesAttendanceStatus = dailyStatus === attendanceStatusFilter;
            }

            return matchesSearch && matchesSpecialty && matchesGroup && matchesAttendanceStatus;
        });

        this.renderAttendanceTable();
        this.updateLiveStatistics();
    }

    // ==========================================
    // العمليات المتقدمة
    // ==========================================

    async markAllPresent() {
        await this.markAllAttendance('present');
    }

    async markAllLate() {
        await this.markAllAttendance('late');
    }

    async markAllAbsent() {
        await this.markAllAttendance('absent');
    }

    async markAllAttendance(status) {
        const confirmed = await app.showConfirmDialog(
            'تأكيد العملية',
            `هل أنت متأكد من تحديد جميع المتدربين كـ "${this.attendanceStates[status].label}"؟`
        );

        if (!confirmed) return;

        try {
            const loadingModal = app.showLoadingModal('جاري تحديث الحضور...');
            
            for (const trainee of this.filteredTrainees) {
                for (const sessionId of Object.keys(this.sessionsInfo)) {
                    await this.updateAttendanceRecord(trainee.id, sessionId, status);
                }
            }

            app.hideLoadingModal();
            this.renderAttendanceTable();
            this.updateLiveStatistics();
            app.showNotification(`تم تحديد جميع المتدربين كـ ${this.attendanceStates[status].label}`, 'success');
            
        } catch (error) {
            app.hideLoadingModal();
            console.error('خطأ في العملية المجمعة:', error);
            app.showNotification('خطأ في تحديث الحضور', 'error');
        }
    }

    async resetAllAttendance() {
        const confirmed = await app.showConfirmDialog(
            'إعادة تعيين الحضور',
            'هل أنت متأكد من إعادة تعيين حضور جميع المتدربين؟ سيتم تحديد الجميع كغائب.'
        );

        if (!confirmed) return;

        await this.markAllAttendance('absent');
    }

    // ==========================================
    // الحفظ التلقائي
    // ==========================================

    startAutoSave() {
        if (this.viewSettings.autoSave) {
            this.autoSaveTimer = setInterval(() => {
                this.saveAllAttendance(false);
            }, 30000); // حفظ كل 30 ثانية
        }
    }

    triggerAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.saveAllAttendance(false);
        }, 2000); // حفظ بعد ثانيتين من آخر تعديل
    }

    async saveAllAttendance(showNotification = true) {
        try {
            document.getElementById('saveStatus').textContent = 'جاري الحفظ...';
            document.getElementById('saveStatus').className = 'text-warning';
            
            // هنا يمكن إضافة منطق الحفظ الإضافي إذا لزم الأمر
            await new Promise(resolve => setTimeout(resolve, 500)); // محاكاة عملية الحفظ
            
            document.getElementById('saveStatus').textContent = 'محفوظ';
            document.getElementById('saveStatus').className = 'text-success';
            
            if (showNotification) {
                app.showNotification('تم حفظ بيانات الحضور بنجاح', 'success');
            }
            
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            document.getElementById('saveStatus').textContent = 'خطأ في الحفظ';
            document.getElementById('saveStatus').className = 'text-danger';
            
            if (showNotification) {
                app.showNotification('خطأ في حفظ البيانات', 'error');
            }
        }
    }

    // ==========================================
    // وظائف الواجهة
    // ==========================================

    setToday() {
        const today = new Date().toISOString().split('T')[0];
        this.currentDate = today;
        document.getElementById('attendanceDate').value = today;
        this.loadTodayAttendance();
        document.getElementById('currentDateDisplay').textContent = this.formatDate(today);
    }

    clearFilters() {
        document.getElementById('searchAttendance').value = '';
        document.getElementById('filterSpecialty').value = '';
        document.getElementById('filterGroup').value = '';
        document.getElementById('filterAttendanceStatus').value = '';
        this.applyFilters();
    }

    toggleSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.trainee-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    }

    showBulkActions() {
        const modal = new bootstrap.Modal(document.getElementById('bulkActionsModal'));
        modal.show();
    }

    async applyBulkAction(status) {
        const session = document.getElementById('bulkActionSession').value;
        const checkboxes = document.querySelectorAll('.trainee-checkbox:checked');
        
        if (checkboxes.length === 0) {
            app.showNotification('يرجى اختيار متدربين أولاً', 'warning');
            return;
        }

        const confirmed = await app.showConfirmDialog(
            'تأكيد العملية المجمعة',
            `هل أنت متأكد من تحديد ${checkboxes.length} متدرب كـ "${this.attendanceStates[status].label}"؟`
        );

        if (!confirmed) return;

        try {
            const loadingModal = app.showLoadingModal('جاري تطبيق العملية...');
            
            for (const checkbox of checkboxes) {
                const traineeId = parseInt(checkbox.value);
                
                if (session === 'all') {
                    for (const sessionId of Object.keys(this.sessionsInfo)) {
                        await this.updateAttendanceRecord(traineeId, sessionId, status);
                    }
                } else {
                    await this.updateAttendanceRecord(traineeId, session, status);
                }
            }

            app.hideLoadingModal();
            bootstrap.Modal.getInstance(document.getElementById('bulkActionsModal')).hide();
            this.renderAttendanceTable();
            this.updateLiveStatistics();
            app.showNotification(`تم تطبيق العملية على ${checkboxes.length} متدرب`, 'success');
            
        } catch (error) {
            app.hideLoadingModal();
            console.error('خطأ في العملية المجمعة:', error);
            app.showNotification('خطأ في تطبيق العملية', 'error');
        }
    }

    showTraineeDetails(traineeId) {
        // سيتم تطوير نافذة تفاصيل الحضور للمتدرب
        console.log('عرض تفاصيل حضور المتدرب:', traineeId);
        app.showNotification('جاري تطوير نافذة التفاصيل', 'info');
    }

    editTraineeAttendance(traineeId) {
        // سيتم تطوير نافذة تعديل الحضور
        console.log('تعديل حضور المتدرب:', traineeId);
        app.showNotification('جاري تطوير نافذة التعديل', 'info');
    }

    async resetTraineeAttendance(traineeId) {
        const trainee = this.trainees.find(t => t.id === traineeId);
        if (!trainee) return;

        const confirmed = await app.showConfirmDialog(
            'إعادة تعيين الحضور',
            `هل أنت متأكد من إعادة تعيين حضور المتدرب "${trainee.fullName}"؟`
        );

        if (!confirmed) return;

        try {
            for (const sessionId of Object.keys(this.sessionsInfo)) {
                await this.updateAttendanceRecord(traineeId, sessionId, 'absent');
            }

            this.renderAttendanceTable();
            this.updateLiveStatistics();
            app.showNotification('تم إعادة تعيين الحضور', 'success');
            
        } catch (error) {
            console.error('خطأ في إعادة التعيين:', error);
            app.showNotification('خطأ في إعادة تعيين الحضور', 'error');
        }
    }

    showAttendanceReport() {
        // سيتم تطوير نافذة التقارير
        console.log('عرض تقارير الحضور');
        app.showNotification('جاري تطوير نافذة التقارير', 'info');
    }

    exportAttendance() {
        // سيتم تطوير ميزة التصدير
        console.log('تصدير بيانات الحضور');
        app.showNotification('جاري تطوير ميزة التصدير', 'info');
    }

    showSettings() {
        // سيتم تطوير نافذة إعدادات الحضور
        console.log('إعدادات الحضور');
        app.showNotification('جاري تطوير نافذة الإعدادات', 'info');
    }

    highlightCurrentSession() {
        // إزالة التمييز من جميع أعمدة الحصص
        document.querySelectorAll('.session-header').forEach(header => {
            header.classList.remove('bg-primary', 'text-white');
        });

        // تمييز الحصة النشطة
        if (this.currentSession !== 'all') {
            const sessionIndex = Object.keys(this.sessionsInfo).indexOf(this.currentSession);
            const headers = document.querySelectorAll('.session-header');
            if (headers[sessionIndex]) {
                headers[sessionIndex].classList.add('bg-primary', 'text-white');
            }
        }
    }

    updateStatisticsChart() {
        // سيتم تطوير الرسوم البيانية لاحقاً
        console.log('تحديث الرسم البياني للإحصائيات');
    }
}

// إنشاء مثيل وحيد
const attendanceManager = new AttendanceManager();

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.attendanceManager = attendanceManager;
}
