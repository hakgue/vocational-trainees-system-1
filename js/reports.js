/**
 * منصة إدارة المتدربين - إدارة التقارير
 * تصدير وطباعة التقارير بصيغ مختلفة (Excel, PDF)
 */

class ReportsManager {
    constructor() {
        this.reportTypes = {
            attendance: 'تقارير الحضور والغياب',
            grades: 'تقارير الدرجات والمعدلات',
            trainees: 'تقارير المتدربين',
            statistical: 'التقارير الإحصائية',
            academic: 'التقارير الأكاديمية'
        };
        
        this.exportFormats = ['excel', 'pdf', 'print'];
        this.reportTemplates = {};
    }

    async init() {
        await this.createReportsSection();
        this.setupEventListeners();
        this.initializeTemplates();
    }

    async createReportsSection() {
        const sectionElement = document.getElementById('reports-section');
        if (!sectionElement) return;

        sectionElement.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-file-alt text-primary"></i>
                    إدارة التقارير
                </h1>
                <p class="page-subtitle">إنشاء وتصدير التقارير المختلفة بتنسيقات متعددة</p>
            </div>

            <!-- أنواع التقارير -->
            <div class="row mb-4">
                <div class="col-xl-2-4 col-md-6 mb-3">
                    <div class="card report-type-card" onclick="reportsManager.selectReportType('attendance')">
                        <div class="card-body text-center">
                            <i class="fas fa-calendar-check fa-3x text-primary mb-3"></i>
                            <h5 class="card-title">تقارير الحضور</h5>
                            <p class="card-text">تقارير الحضور والغياب اليومية والشهرية</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-2-4 col-md-6 mb-3">
                    <div class="card report-type-card" onclick="reportsManager.selectReportType('grades')">
                        <div class="card-body text-center">
                            <i class="fas fa-chart-line fa-3x text-success mb-3"></i>
                            <h5 class="card-title">تقارير الدرجات</h5>
                            <p class="card-text">تقارير الدرجات والمعدلات والأداء</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-2-4 col-md-6 mb-3">
                    <div class="card report-type-card" onclick="reportsManager.selectReportType('trainees')">
                        <div class="card-body text-center">
                            <i class="fas fa-users fa-3x text-warning mb-3"></i>
                            <h5 class="card-title">تقارير المتدربين</h5>
                            <p class="card-text">بيانات المتدربين وإحصائياتهم</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-2-4 col-md-6 mb-3">
                    <div class="card report-type-card" onclick="reportsManager.selectReportType('statistical')">
                        <div class="card-body text-center">
                            <i class="fas fa-chart-pie fa-3x text-info mb-3"></i>
                            <h5 class="card-title">التقارير الإحصائية</h5>
                            <p class="card-text">إحصائيات وتحليلات شاملة</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-2-4 col-md-6 mb-3">
                    <div class="card report-type-card" onclick="reportsManager.selectReportType('academic')">
                        <div class="card-body text-center">
                            <i class="fas fa-graduation-cap fa-3x text-danger mb-3"></i>
                            <h5 class="card-title">التقارير الأكاديمية</h5>
                            <p class="card-text">كشوف الدرجات والشهادات</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- واجهة إنشاء التقرير -->
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-file-export"></i>
                        إنشاء تقرير جديد
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <!-- نوع التقرير -->
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label for="reportType" class="form-label">نوع التقرير</label>
                                <select class="form-select" id="reportType" onchange="reportsManager.onReportTypeChange(this.value)">
                                    <option value="">اختر نوع التقرير</option>
                                    ${Object.entries(this.reportTypes).map(([key, value]) => 
                                        `<option value="${key}">${value}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <!-- الفترة الزمنية -->
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label for="reportPeriod" class="form-label">الفترة الزمنية</label>
                                <select class="form-select" id="reportPeriod" onchange="reportsManager.onPeriodChange(this.value)">
                                    <option value="today">اليوم</option>
                                    <option value="week">هذا الأسبوع</option>
                                    <option value="month">هذا الشهر</option>
                                    <option value="quarter">هذا الفصل</option>
                                    <option value="year">هذا العام</option>
                                    <option value="custom">فترة مخصصة</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- تاريخ البداية -->
                        <div class="col-md-3" id="customDateContainer" style="display: none;">
                            <div class="row">
                                <div class="col-6">
                                    <div class="mb-3">
                                        <label for="startDate" class="form-label">من تاريخ</label>
                                        <input type="date" class="form-control" id="startDate">
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="mb-3">
                                        <label for="endDate" class="form-label">إلى تاريخ</label>
                                        <input type="date" class="form-control" id="endDate">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- أزرار الإجراءات -->
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">إجراءات</label>
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-primary btn-sm" onclick="reportsManager.generateReport()" id="generateReportBtn" disabled>
                                        <i class="fas fa-play"></i> إنشاء
                                    </button>
                                    <div class="btn-group">
                                        <button type="button" class="btn btn-success btn-sm dropdown-toggle" 
                                                data-bs-toggle="dropdown" id="exportBtn" disabled>
                                            <i class="fas fa-download"></i> تصدير
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="reportsManager.exportReport('excel')">
                                                <i class="fas fa-file-excel"></i> Excel
                                            </a></li>
                                            <li><a class="dropdown-item" href="#" onclick="reportsManager.exportReport('pdf')">
                                                <i class="fas fa-file-pdf"></i> PDF
                                            </a></li>
                                            <li><a class="dropdown-item" href="#" onclick="reportsManager.printReport()">
                                                <i class="fas fa-print"></i> طباعة
                                            </a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- خيارات إضافية -->
                    <div class="row" id="additionalOptions" style="display: none;">
                        <div class="col-md-12">
                            <div class="border-top pt-3">
                                <h6 class="text-muted">خيارات إضافية</h6>
                                <div class="row" id="specificOptions">
                                    <!-- سيتم ملؤها حسب نوع التقرير -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- عرض التقرير -->
            <div class="card mt-4" id="reportResultCard" style="display: none;">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-file-alt"></i>
                        نتيجة التقرير
                        <span class="float-end">
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="reportsManager.refreshReport()">
                                <i class="fas fa-refresh"></i> تحديث
                            </button>
                        </span>
                    </h5>
                </div>
                <div class="card-body">
                    <div id="reportContent">
                        <!-- سيتم ملؤها بمحتوى التقرير -->
                    </div>
                </div>
            </div>

            <!-- التقارير المحفوظة -->
            <div class="card mt-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-history"></i>
                        التقارير المحفوظة
                    </h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>اسم التقرير</th>
                                    <th>النوع</th>
                                    <th>الفترة</th>
                                    <th>تاريخ الإنشاء</th>
                                    <th>الحجم</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="savedReportsTable">
                                <!-- سيتم ملؤها بالتقارير المحفوظة -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // مراقبة تغيير نوع التقرير
        const reportTypeSelect = document.getElementById('reportType');
        if (reportTypeSelect) {
            reportTypeSelect.addEventListener('change', (e) => {
                this.onReportTypeChange(e.target.value);
            });
        }

        // مراقبة تغيير الفترة الزمنية
        const periodSelect = document.getElementById('reportPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.onPeriodChange(e.target.value);
            });
        }

        // مراقبة اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.generateReport();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.printReport();
                        break;
                }
            }
        });
    }

    initializeTemplates() {
        // تهيئة قوالب التقارير
        this.reportTemplates = {
            attendance: this.getAttendanceReportTemplate(),
            grades: this.getGradesReportTemplate(),
            trainees: this.getTraineesReportTemplate(),
            statistical: this.getStatisticalReportTemplate(),
            academic: this.getAcademicReportTemplate()
        };
    }

    selectReportType(type) {
        const reportTypeSelect = document.getElementById('reportType');
        if (reportTypeSelect) {
            reportTypeSelect.value = type;
            this.onReportTypeChange(type);
        }
    }

    onReportTypeChange(type) {
        const generateBtn = document.getElementById('generateReportBtn');
        const exportBtn = document.getElementById('exportBtn');
        const additionalOptions = document.getElementById('additionalOptions');
        const specificOptions = document.getElementById('specificOptions');

        if (type) {
            generateBtn.disabled = false;
            additionalOptions.style.display = 'block';
            
            // إظهار خيارات خاصة بنوع التقرير
            specificOptions.innerHTML = this.getSpecificOptions(type);
        } else {
            generateBtn.disabled = true;
            exportBtn.disabled = true;
            additionalOptions.style.display = 'none';
        }
    }

    onPeriodChange(period) {
        const customDateContainer = document.getElementById('customDateContainer');
        
        if (period === 'custom') {
            customDateContainer.style.display = 'block';
        } else {
            customDateContainer.style.display = 'none';
        }
    }

    getSpecificOptions(reportType) {
        switch (reportType) {
            case 'attendance':
                return `
                    <div class="col-md-4">
                        <label for="attendanceSpecialty" class="form-label">التخصص</label>
                        <select class="form-select" id="attendanceSpecialty">
                            <option value="">جميع التخصصات</option>
                            ${database.professionalBranches.map(branch => 
                                `<option value="${branch.id}">${branch.nameAr}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label for="attendanceGroup" class="form-label">المجموعة</label>
                        <select class="form-select" id="attendanceGroup">
                            <option value="">جميع المجموعات</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label for="attendanceStatus" class="form-label">حالة الحضور</label>
                        <select class="form-select" id="attendanceStatus">
                            <option value="">جميع الحالات</option>
                            <option value="present">حاضر</option>
                            <option value="absent">غائب</option>
                            <option value="late">متأخر</option>
                        </select>
                    </div>
                `;
                
            case 'grades':
                return `
                    <div class="col-md-4">
                        <label for="gradesSubject" class="form-label">المادة</label>
                        <select class="form-select" id="gradesSubject">
                            <option value="">جميع المواد</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label for="evaluationType" class="form-label">نوع التقييم</label>
                        <select class="form-select" id="evaluationType">
                            <option value="">جميع التقييمات</option>
                            <option value="exam1">امتحان أول</option>
                            <option value="exam2">امتحان ثاني</option>
                            <option value="final">امتحان نهائي</option>
                            <option value="participation">المشاركة</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label for="includeStatistics" class="form-label">إضافات</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="includeStatistics" checked>
                            <label class="form-check-label" for="includeStatistics">
                                تضمين الإحصائيات
                            </label>
                        </div>
                    </div>
                `;
                
            case 'trainees':
                return `
                    <div class="col-md-4">
                        <label for="traineeStatus" class="form-label">حالة المتدرب</label>
                        <select class="form-select" id="traineeStatus">
                            <option value="">جميع الحالات</option>
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                            <option value="graduated">متخرج</option>
                            <option value="suspended">معلق</option>
                            <option value="dropped">منقطع</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label for="includePersonalInfo" class="form-label">المعلومات الشخصية</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="includePersonalInfo" checked>
                            <label class="form-check-label" for="includePersonalInfo">
                                تضمين المعلومات الشخصية
                            </label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <label for="includeAcademicInfo" class="form-label">المعلومات الأكاديمية</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="includeAcademicInfo" checked>
                            <label class="form-check-label" for="includeAcademicInfo">
                                تضمين المعلومات الأكاديمية
                            </label>
                        </div>
                    </div>
                `;
                
            default:
                return '';
        }
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const period = document.getElementById('reportPeriod').value;
        
        if (!reportType) {
            app.showError('يرجى اختيار نوع التقرير');
            return;
        }

        try {
            // عرض مؤشر التحميل
            this.showLoadingIndicator();
            
            // جلب البيانات وإنشاء التقرير
            const reportData = await this.fetchReportData(reportType, period);
            const reportHTML = await this.generateReportHTML(reportType, reportData);
            
            // عرض التقرير
            this.displayReport(reportHTML);
            
            // تفعيل أزرار التصدير
            document.getElementById('exportBtn').disabled = false;
            
        } catch (error) {
            console.error('خطأ في إنشاء التقرير:', error);
            app.showError('خطأ في إنشاء التقرير');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async fetchReportData(reportType, period) {
        const dateRange = this.getDateRange(period);
        
        switch (reportType) {
            case 'attendance':
                return await this.fetchAttendanceData(dateRange);
            case 'grades':
                return await this.fetchGradesData(dateRange);
            case 'trainees':
                return await this.fetchTraineesData();
            case 'statistical':
                return await this.fetchStatisticalData(dateRange);
            case 'academic':
                return await this.fetchAcademicData(dateRange);
            default:
                throw new Error('نوع تقرير غير معروف');
        }
    }

    getDateRange(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (period) {
            case 'today':
                return {
                    start: today,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                return { start: weekStart, end: weekEnd };
                
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return { start: monthStart, end: monthEnd };
                
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
                const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 0);
                return { start: quarterStart, end: quarterEnd };
                
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                const yearEnd = new Date(today.getFullYear(), 11, 31);
                return { start: yearStart, end: yearEnd };
                
            case 'custom':
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                return {
                    start: startDate ? new Date(startDate) : today,
                    end: endDate ? new Date(endDate) : today
                };
                
            default:
                return { start: today, end: today };
        }
    }

    async fetchAttendanceData(dateRange) {
        const attendance = [];
        const trainees = await database.getAllTrainees();
        
        // جلب بيانات الحضور للفترة المحددة
        for (let d = new Date(dateRange.start); d <= dateRange.end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayAttendance = await database.getAttendanceByDate(dateStr);
            attendance.push(...dayAttendance);
        }
        
        return {
            attendance,
            trainees,
            dateRange,
            summary: this.calculateAttendanceSummary(attendance, trainees)
        };
    }

    calculateAttendanceSummary(attendance, trainees) {
        const totalRecords = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const lateCount = attendance.filter(a => a.status === 'late').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        
        return {
            totalRecords,
            presentCount,
            lateCount,
            absentCount,
            presentPercentage: totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : 0,
            latePercentage: totalRecords > 0 ? (lateCount / totalRecords * 100).toFixed(1) : 0,
            absentPercentage: totalRecords > 0 ? (absentCount / totalRecords * 100).toFixed(1) : 0
        };
    }

    async generateReportHTML(reportType, data) {
        const template = this.reportTemplates[reportType];
        if (!template) {
            throw new Error('قالب التقرير غير موجود');
        }
        
        return template(data);
    }

    getAttendanceReportTemplate() {
        return (data) => `
            <div class="report-container">
                <div class="report-header text-center mb-4">
                    <h2>تقرير الحضور والغياب</h2>
                    <p class="text-muted">
                        من ${data.dateRange.start.toLocaleDateString('ar-DZ')} 
                        إلى ${data.dateRange.end.toLocaleDateString('ar-DZ')}
                    </p>
                </div>
                
                <!-- الملخص الإحصائي -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="stat-box bg-primary text-white text-center p-3 rounded">
                            <h4>${data.summary.totalRecords}</h4>
                            <p>إجمالي السجلات</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-box bg-success text-white text-center p-3 rounded">
                            <h4>${data.summary.presentCount}</h4>
                            <p>حاضر (${data.summary.presentPercentage}%)</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-box bg-warning text-white text-center p-3 rounded">
                            <h4>${data.summary.lateCount}</h4>
                            <p>متأخر (${data.summary.latePercentage}%)</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-box bg-danger text-white text-center p-3 rounded">
                            <h4>${data.summary.absentCount}</h4>
                            <p>غائب (${data.summary.absentPercentage}%)</p>
                        </div>
                    </div>
                </div>
                
                <!-- جدول تفصيلي -->
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th>رقم التسجيل</th>
                                <th>اسم المتدرب</th>
                                <th>التخصص</th>
                                <th>المجموعة</th>
                                <th>التاريخ</th>
                                <th>الفترة</th>
                                <th>الحالة</th>
                                <th>وقت الوصول</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.attendance.map(record => {
                                const trainee = data.trainees.find(t => t.id === record.traineeId);
                                const statusBadge = this.getStatusBadgeForReport(record.status);
                                const branchName = this.getBranchName(trainee?.specialty || '');
                                
                                return `
                                    <tr>
                                        <td>${trainee?.registrationNumber || 'غير محدد'}</td>
                                        <td>${trainee?.fullName || 'غير محدد'}</td>
                                        <td>${branchName}</td>
                                        <td>${trainee?.group || 'غير محدد'}</td>
                                        <td>${new Date(record.date).toLocaleDateString('ar-DZ')}</td>
                                        <td>${record.period === 'period1' ? 'الأولى' : 'الثانية'}</td>
                                        <td>${statusBadge}</td>
                                        <td>${record.arrivalTime || '-'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getGradesReportTemplate() {
        return (data) => `
            <div class="report-container">
                <div class="report-header text-center mb-4">
                    <h2>تقرير الدرجات والمعدلات</h2>
                    <p class="text-muted">تقرير شامل للدرجات والأداء الأكاديمي</p>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th>المتدرب</th>
                                <th>المادة</th>
                                <th>نوع التقييم</th>
                                <th>الدرجة</th>
                                <th>المعامل</th>
                                <th>تاريخ التقييم</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- سيتم ملؤها بالبيانات -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getTraineesReportTemplate() {
        return (data) => `
            <div class="report-container">
                <div class="report-header text-center mb-4">
                    <h2>تقرير المتدربين</h2>
                    <p class="text-muted">قائمة شاملة بمعلومات المتدربين</p>
                </div>
                <!-- محتوى تقرير المتدربين -->
            </div>
        `;
    }

    getStatisticalReportTemplate() {
        return (data) => `
            <div class="report-container">
                <div class="report-header text-center mb-4">
                    <h2>التقرير الإحصائي</h2>
                    <p class="text-muted">إحصائيات وتحليلات شاملة</p>
                </div>
                <!-- محتوى التقرير الإحصائي -->
            </div>
        `;
    }

    getAcademicReportTemplate() {
        return (data) => `
            <div class="report-container">
                <div class="report-header text-center mb-4">
                    <h2>التقرير الأكاديمي</h2>
                    <p class="text-muted">كشوف الدرجات والشهادات الأكاديمية</p>
                </div>
                <!-- محتوى التقرير الأكاديمي -->
            </div>
        `;
    }

    displayReport(reportHTML) {
        const reportCard = document.getElementById('reportResultCard');
        const reportContent = document.getElementById('reportContent');
        
        if (reportCard && reportContent) {
            reportContent.innerHTML = reportHTML;
            reportCard.style.display = 'block';
            
            // التمرير إلى التقرير
            reportCard.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showLoadingIndicator() {
        const reportContent = document.getElementById('reportContent');
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p class="text-muted">جاري إنشاء التقرير...</p>
                </div>
            `;
        }
        
        const reportCard = document.getElementById('reportResultCard');
        if (reportCard) {
            reportCard.style.display = 'block';
        }
    }

    hideLoadingIndicator() {
        // سيتم إخفاء مؤشر التحميل عند عرض التقرير
    }

    getStatusBadgeForReport(status) {
        const statusMap = {
            'present': '<span class="badge bg-success">حاضر</span>',
            'absent': '<span class="badge bg-danger">غائب</span>',
            'late': '<span class="badge bg-warning">متأخر</span>'
        };
        return statusMap[status] || `<span class="badge bg-secondary">${status}</span>`;
    }

    getBranchName(branchId) {
        const branch = database.professionalBranches?.find(b => b.id === branchId);
        return branch ? branch.nameAr : branchId;
    }

    async exportReport(format) {
        try {
            const reportContent = document.getElementById('reportContent');
            if (!reportContent) {
                app.showError('لا يوجد تقرير لتصديره');
                return;
            }

            switch (format) {
                case 'excel':
                    await this.exportToExcel();
                    break;
                case 'pdf':
                    await this.exportToPDF();
                    break;
                default:
                    app.showError('صيغة تصدير غير مدعومة');
            }
        } catch (error) {
            console.error('خطأ في تصدير التقرير:', error);
            app.showError('خطأ في تصدير التقرير');
        }
    }

    async exportToExcel() {
        // تصدير إلى Excel باستخدام SheetJS
        const reportContent = document.getElementById('reportContent');
        const tables = reportContent.querySelectorAll('table');
        
        if (tables.length === 0) {
            app.showError('لا توجد جداول للتصدير');
            return;
        }

        const wb = XLSX.utils.book_new();
        
        tables.forEach((table, index) => {
            const ws = XLSX.utils.table_to_sheet(table);
            XLSX.utils.book_append_sheet(wb, ws, `Sheet${index + 1}`);
        });
        
        const filename = `report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        app.showSuccess('تم تصدير التقرير بنجاح');
    }

    async exportToPDF() {
        // تصدير إلى PDF
        const reportContent = document.getElementById('reportContent');
        
        // يمكن استخدام مكتبة jsPDF أو طباعة الصفحة
        window.print();
    }

    printReport() {
        // طباعة التقرير
        const reportContent = document.getElementById('reportContent');
        if (!reportContent) {
            app.showError('لا يوجد تقرير للطباعة');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>طباعة التقرير</title>
                <style>
                    body { font-family: 'Cairo', sans-serif; direction: rtl; }
                    .table { border-collapse: collapse; width: 100%; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    .table th { background-color: #f8f9fa; }
                    .stat-box { display: inline-block; margin: 10px; padding: 15px; border-radius: 5px; }
                    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                    .bg-success { background-color: #28a745; color: white; }
                    .bg-danger { background-color: #dc3545; color: white; }
                    .bg-warning { background-color: #ffc107; color: black; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                ${reportContent.innerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    refreshReport() {
        this.generateReport();
    }

    // المزيد من الوظائف...
    async fetchGradesData(dateRange) {
        // جلب بيانات الدرجات
        return {};
    }

    async fetchTraineesData() {
        // جلب بيانات المتدربين
        return {};
    }

    async fetchStatisticalData(dateRange) {
        // جلب البيانات الإحصائية
        return {};
    }

    async fetchAcademicData(dateRange) {
        // جلب البيانات الأكاديمية
        return {};
    }
}

// تصدير الكلاس
if (typeof window !== 'undefined') {
    window.ReportsManager = ReportsManager;
    window.reportsManager = new ReportsManager();
}