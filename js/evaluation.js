/**
 * منصة إدارة المتدربين - إدارة التقييم والدرجات
 * نظام تقييم مرن مع معاملات قابلة للتخصيص
 */

class EvaluationManager {
    constructor() {
        this.currentSubjects = [];
        this.currentGrades = [];
        this.selectedTrainee = null;
        this.selectedSubject = null;
        this.evaluationTypes = [
            { id: 'exam1', name: 'امتحان أول', weight: 25 },
            { id: 'exam2', name: 'امتحان ثاني', weight: 25 },
            { id: 'final', name: 'امتحان نهائي', weight: 40 },
            { id: 'participation', name: 'المشاركة', weight: 10 }
        ];
        this.gradeScale = 20; // السلم الدراسي من 20
        this.passingGrade = 10; // النقطة المطلوبة للنجاح
    }

    async init() {
        await this.createEvaluationSection();
        await this.loadEvaluationData();
        this.setupEventListeners();
    }

    async createEvaluationSection() {
        const sectionElement = document.getElementById('evaluation-section');
        if (!sectionElement) return;

        sectionElement.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-chart-line text-primary"></i>
                    إدارة التقييم والدرجات
                </h1>
                <p class="page-subtitle">تسجيل التقييمات وحساب المعدلات بنظام المعاملات المرن</p>
            </div>

            <!-- شريط التحكم -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <button type="button" class="btn btn-primary" onclick="evaluationManager.showAddSubjectModal()">
                                <i class="fas fa-plus"></i> إضافة مادة جديدة
                            </button>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filterBySpecialty" onchange="evaluationManager.filterBySpecialty(this.value)">
                                <option value="">جميع التخصصات</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filterByLevel" onchange="evaluationManager.filterByLevel(this.value)">
                                <option value="">جميع المستويات</option>
                            </select>
                        </div>
                        <div class="col-md-3 text-end">
                            <button type="button" class="btn btn-outline-primary" onclick="evaluationManager.showGradeAnalytics()">
                                <i class="fas fa-analytics"></i> إحصائيات
                            </button>
                            <button type="button" class="btn btn-outline-success" onclick="evaluationManager.exportGrades()">
                                <i class="fas fa-download"></i> تصدير
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- إحصائيات سريعة -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stats-card stats-primary">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col me-2">
                                    <div class="stats-label">إجمالي المواد</div>
                                    <div class="stats-number" id="totalSubjects">0</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-book fa-2x text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stats-card stats-success">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col me-2">
                                    <div class="stats-label">متوسط النجاح</div>
                                    <div class="stats-number" id="successRate">0%</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-graduation-cap fa-2x text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stats-card stats-warning">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col me-2">
                                    <div class="stats-label">المعدل العام</div>
                                    <div class="stats-number" id="overallAverage">0</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-chart-bar fa-2x text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-md-6 mb-3">
                    <div class="card stats-card stats-info">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col me-2">
                                    <div class="stats-label">التقييمات المسجلة</div>
                                    <div class="stats-number" id="totalEvaluations">0</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clipboard-list fa-2x text-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- التبويبات الرئيسية -->
            <div class="card">
                <div class="card-header">
                    <ul class="nav nav-tabs card-header-tabs" id="evaluationTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="subjects-tab" data-bs-toggle="tab" 
                                    data-bs-target="#subjects-content" type="button" role="tab">
                                <i class="fas fa-book"></i> إدارة المواد
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="grades-tab" data-bs-toggle="tab" 
                                    data-bs-target="#grades-content" type="button" role="tab">
                                <i class="fas fa-edit"></i> تسجيل الدرجات
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="averages-tab" data-bs-toggle="tab" 
                                    data-bs-target="#averages-content" type="button" role="tab">
                                <i class="fas fa-calculator"></i> المعدلات
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="analytics-tab" data-bs-toggle="tab" 
                                    data-bs-target="#analytics-content" type="button" role="tab">
                                <i class="fas fa-chart-pie"></i> التحليلات
                            </button>
                        </li>
                    </ul>
                </div>
                <div class="card-body">
                    <div class="tab-content" id="evaluationTabContent">
                        <!-- تبويب إدارة المواد -->
                        <div class="tab-pane fade show active" id="subjects-content" role="tabpanel">
                            <div class="table-responsive">
                                <table class="table table-hover" id="subjectsTable">
                                    <thead>
                                        <tr>
                                            <th>اسم المادة</th>
                                            <th>التخصص</th>
                                            <th>المستوى</th>
                                            <th>المعامل</th>
                                            <th>نوع التقييم</th>
                                            <th>عدد المتدربين</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody id="subjectsTableBody">
                                        <!-- سيتم ملؤها ديناميكياً -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- تبويب تسجيل الدرجات -->
                        <div class="tab-pane fade" id="grades-content" role="tabpanel">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">اختيار المادة</h6>
                                        </div>
                                        <div class="card-body">
                                            <select class="form-select mb-3" id="gradeSubjectSelect" 
                                                    onchange="evaluationManager.selectSubjectForGrading(this.value)">
                                                <option value="">اختر المادة</option>
                                            </select>
                                            
                                            <select class="form-select mb-3" id="evaluationTypeSelect" 
                                                    onchange="evaluationManager.selectEvaluationType(this.value)">
                                                <option value="">نوع التقييم</option>
                                            </select>
                                            
                                            <button type="button" class="btn btn-primary w-100" 
                                                    onclick="evaluationManager.loadGradingInterface()" id="loadGradingBtn" disabled>
                                                تحميل واجهة التقييم
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-8">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">تسجيل الدرجات</h6>
                                        </div>
                                        <div class="card-body" id="gradingInterface">
                                            <div class="text-center text-muted py-5">
                                                <i class="fas fa-clipboard-list fa-3x mb-3"></i>
                                                <p>اختر المادة ونوع التقييم لبدء تسجيل الدرجات</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- تبويب المعدلات -->
                        <div class="tab-pane fade" id="averages-content" role="tabpanel">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">فلترة المعدلات</h6>
                                        </div>
                                        <div class="card-body">
                                            <select class="form-select mb-3" id="averageSpecialtyFilter">
                                                <option value="">جميع التخصصات</option>
                                            </select>
                                            
                                            <select class="form-select mb-3" id="averageGroupFilter">
                                                <option value="">جميع المجموعات</option>
                                            </select>
                                            
                                            <button type="button" class="btn btn-primary w-100" 
                                                    onclick="evaluationManager.calculateAverages()">
                                                حساب المعدلات
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-8">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">جدول المعدلات</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="table-responsive" id="averagesTableContainer">
                                                <div class="text-center text-muted py-5">
                                                    <i class="fas fa-calculator fa-3x mb-3"></i>
                                                    <p>اضغط "حساب المعدلات" لعرض النتائج</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- تبويب التحليلات -->
                        <div class="tab-pane fade" id="analytics-content" role="tabpanel">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">توزيع الدرجات</h6>
                                        </div>
                                        <div class="card-body">
                                            <canvas id="gradesDistributionChart" height="300"></canvas>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">الأداء حسب المادة</h6>
                                        </div>
                                        <div class="card-body">
                                            <canvas id="subjectPerformanceChart" height="300"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mt-4">
                                <div class="col-md-12">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">معدل الأداء الشهري</h6>
                                        </div>
                                        <div class="card-body">
                                            <canvas id="monthlyPerformanceChart" height="200"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // مراقبة تغيير التبويبات
        const tabs = document.querySelectorAll('#evaluationTabs button[data-bs-toggle="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const targetId = e.target.getAttribute('data-bs-target').replace('#', '');
                this.onTabShown(targetId);
            });
        });

        // مراقبة تحديد المادة للتقييم
        const subjectSelect = document.getElementById('gradeSubjectSelect');
        if (subjectSelect) {
            subjectSelect.addEventListener('change', () => {
                this.updateEvaluationTypes();
            });
        }
    }

    async loadEvaluationData() {
        try {
            // تحميل المواد
            this.currentSubjects = await database.getAllSubjects();
            
            // تحميل الدرجات
            this.currentGrades = await database.getAllGrades();
            
            // تحديث الواجهة
            await this.updateSubjectsTable();
            await this.updateStatistics();
            await this.populateFilters();
            
        } catch (error) {
            console.error('خطأ في تحميل بيانات التقييم:', error);
            app.showError('خطأ في تحميل بيانات التقييم');
        }
    }

    async updateSubjectsTable() {
        const tbody = document.getElementById('subjectsTableBody');
        if (!tbody) return;

        if (this.currentSubjects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-book fa-2x text-muted mb-2"></i>
                        <p class="text-muted mb-0">لا توجد مواد مسجلة</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.currentSubjects.map(subject => this.createSubjectRow(subject)).join('');
    }

    createSubjectRow(subject) {
        const branch = database.getBranchById(subject.specialty);
        const level = database.getLevelById(subject.level);
        const specialtyName = branch ? branch.nameAr : subject.specialty;
        const levelName = level ? level.nameAr : `مستوى ${subject.level}`;
        
        // حساب عدد المتدربين للمادة
        const traineeCount = this.getTraineeCountForSubject(subject);
        
        return `
            <tr data-subject-id="${subject.id}">
                <td>
                    <div class="fw-bold">${subject.name}</div>
                    <small class="text-muted">${subject.code || ''}</small>
                </td>
                <td>
                    <span class="badge specialty-${subject.specialty.toLowerCase()} rounded-pill">
                        ${specialtyName}
                    </span>
                </td>
                <td>
                    <span class="badge level-${subject.level} rounded-pill">
                        ${levelName}
                    </span>
                </td>
                <td>
                    <span class="badge bg-info">${subject.coefficient || 1}</span>
                </td>
                <td>
                    <span class="badge bg-secondary">${subject.evaluationType || 'تقليدي'}</span>
                </td>
                <td>
                    <span class="badge bg-primary">${traineeCount} متدرب</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary" 
                                onclick="evaluationManager.viewSubjectDetails(${subject.id})" title="التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning" 
                                onclick="evaluationManager.editSubject(${subject.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" 
                                onclick="evaluationManager.deleteSubject(${subject.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getTraineeCountForSubject(subject) {
        // يمكن تحسين هذا بربطه بقاعدة البيانات
        return 25; // رقم وهمي للآن
    }

    async updateStatistics() {
        const stats = {
            totalSubjects: this.currentSubjects.length,
            totalEvaluations: this.currentGrades.length,
            successRate: this.calculateSuccessRate(),
            overallAverage: this.calculateOverallAverage()
        };

        // تحديث العداد
        this.animateStatsCards(stats);
    }

    calculateSuccessRate() {
        if (this.currentGrades.length === 0) return 0;
        
        const passingGrades = this.currentGrades.filter(grade => grade.score >= this.passingGrade);
        return Math.round((passingGrades.length / this.currentGrades.length) * 100);
    }

    calculateOverallAverage() {
        if (this.currentGrades.length === 0) return 0;
        
        const sum = this.currentGrades.reduce((acc, grade) => acc + grade.score, 0);
        return Math.round((sum / this.currentGrades.length) * 100) / 100;
    }

    animateStatsCards(stats) {
        const elements = {
            totalSubjects: document.getElementById('totalSubjects'),
            totalEvaluations: document.getElementById('totalEvaluations'),
            successRate: document.getElementById('successRate'),
            overallAverage: document.getElementById('overallAverage')
        };
        
        Object.entries(elements).forEach(([key, element]) => {
            if (element && stats[key] !== undefined) {
                if (key === 'successRate') {
                    app.animateCounter(element, stats[key], '%');
                } else {
                    app.animateCounter(element, stats[key]);
                }
            }
        });
    }

    async populateFilters() {
        // ملء فلاتر التخصصات
        const specialtySelects = ['filterBySpecialty', 'averageSpecialtyFilter'];
        specialtySelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const options = database.professionalBranches.map(branch => 
                    `<option value="${branch.id}">${branch.nameAr}</option>`
                ).join('');
                select.innerHTML = `<option value="">جميع التخصصات</option>${options}`;
            }
        });

        // ملء فلاتر المستويات
        const levelSelects = ['filterByLevel'];
        levelSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const options = database.trainingLevels.map(level => 
                    `<option value="${level.id}">${level.nameAr}</option>`
                ).join('');
                select.innerHTML = `<option value="">جميع المستويات</option>${options}`;
            }
        });

        // ملء اختيار المواد للتقييم
        const gradeSubjectSelect = document.getElementById('gradeSubjectSelect');
        if (gradeSubjectSelect) {
            const options = this.currentSubjects.map(subject => 
                `<option value="${subject.id}">${subject.name} - ${this.getBranchName(subject.specialty)}</option>`
            ).join('');
            gradeSubjectSelect.innerHTML = `<option value="">اختر المادة</option>${options}`;
        }
    }

    getBranchName(branchId) {
        const branch = database.professionalBranches.find(b => b.id === branchId);
        return branch ? branch.nameAr : branchId;
    }

    updateEvaluationTypes() {
        const select = document.getElementById('evaluationTypeSelect');
        const loadBtn = document.getElementById('loadGradingBtn');
        
        if (!select || !loadBtn) return;

        const options = this.evaluationTypes.map(type => 
            `<option value="${type.id}">${type.name} (${type.weight}%)</option>`
        ).join('');
        
        select.innerHTML = `<option value="">نوع التقييم</option>${options}`;
        
        // تحديث حالة الزر
        const subjectSelected = document.getElementById('gradeSubjectSelect').value;
        loadBtn.disabled = !subjectSelected;
    }

    onTabShown(tabId) {
        switch (tabId) {
            case 'analytics-content':
                this.loadAnalyticsCharts();
                break;
            case 'averages-content':
                this.updateAverageFilters();
                break;
        }
    }

    async loadAnalyticsCharts() {
        try {
            // رسم توزيع الدرجات
            await this.createGradesDistributionChart();
            
            // رسم الأداء حسب المادة
            await this.createSubjectPerformanceChart();
            
            // رسم الأداء الشهري
            await this.createMonthlyPerformanceChart();
            
        } catch (error) {
            console.error('خطأ في تحميل الرسوم البيانية:', error);
        }
    }

    async createGradesDistributionChart() {
        const canvas = document.getElementById('gradesDistributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // تجميع الدرجات في نطاقات
        const ranges = [
            { label: 'ممتاز (18-20)', min: 18, max: 20, color: '#48bb78' },
            { label: 'جيد جداً (16-17)', min: 16, max: 17, color: '#4299e1' },
            { label: 'جيد (14-15)', min: 14, max: 15, color: '#ed8936' },
            { label: 'مقبول (10-13)', min: 10, max: 13, color: '#ecc94b' },
            { label: 'ضعيف (0-9)', min: 0, max: 9, color: '#f56565' }
        ];

        const distribution = ranges.map(range => ({
            ...range,
            count: this.currentGrades.filter(grade => 
                grade.score >= range.min && grade.score <= range.max
            ).length
        }));

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distribution.map(d => d.label),
                datasets: [{
                    data: distribution.map(d => d.count),
                    backgroundColor: distribution.map(d => d.color),
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
                        textDirection: 'rtl'
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl'
                    }
                }
            }
        });
    }

    async createSubjectPerformanceChart() {
        const canvas = document.getElementById('subjectPerformanceChart');
        if (!canvas) return;

        // حساب متوسط الدرجات لكل مادة
        const subjectAverages = {};
        this.currentSubjects.forEach(subject => {
            const subjectGrades = this.currentGrades.filter(grade => grade.subjectId === subject.id);
            if (subjectGrades.length > 0) {
                const average = subjectGrades.reduce((sum, grade) => sum + grade.score, 0) / subjectGrades.length;
                subjectAverages[subject.name] = Math.round(average * 100) / 100;
            }
        });

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(subjectAverages),
                datasets: [{
                    label: 'متوسط الدرجات',
                    data: Object.values(subjectAverages),
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
                        max: this.gradeScale
                    }
                }
            }
        });
    }

    async createMonthlyPerformanceChart() {
        const canvas = document.getElementById('monthlyPerformanceChart');
        if (!canvas) return;

        // بيانات وهمية للأداء الشهري
        const monthlyData = [
            { month: 'سبتمبر', average: 14.5 },
            { month: 'أكتوبر', average: 15.2 },
            { month: 'نوفمبر', average: 14.8 },
            { month: 'ديسمبر', average: 16.1 },
            { month: 'يناير', average: 15.7 },
            { month: 'فبراير', average: 16.3 }
        ];

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [{
                    label: 'المعدل الشهري',
                    data: monthlyData.map(d => d.average),
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        rtl: true,
                        textDirection: 'rtl'
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: this.gradeScale
                    }
                }
            }
        });
    }

    // ==========================================
    // عمليات CRUD للمواد
    // ==========================================

    showAddSubjectModal() {
        // إنشاء نافذة إضافة مادة جديدة
        const modalHTML = this.createSubjectModal();
        this.showModal('إضافة مادة جديدة', modalHTML, 'lg');
    }

    createSubjectModal(subject = null) {
        const isEdit = subject !== null;
        const title = isEdit ? 'تعديل المادة' : 'إضافة مادة جديدة';
        
        return `
            <form id="subjectForm" onsubmit="evaluationManager.${isEdit ? 'updateSubject' : 'addSubject'}(event)">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="subjectName" class="form-label">اسم المادة <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="subjectName" 
                                   value="${subject ? subject.name : ''}" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="subjectCode" class="form-label">رمز المادة</label>
                            <input type="text" class="form-control" id="subjectCode" 
                                   value="${subject ? subject.code || '' : ''}">
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="subjectSpecialty" class="form-label">التخصص <span class="text-danger">*</span></label>
                            <select class="form-select" id="subjectSpecialty" required>
                                <option value="">اختر التخصص</option>
                                ${database.professionalBranches.map(branch => 
                                    `<option value="${branch.id}" ${subject && subject.specialty === branch.id ? 'selected' : ''}>
                                        ${branch.nameAr}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="subjectLevel" class="form-label">المستوى <span class="text-danger">*</span></label>
                            <select class="form-select" id="subjectLevel" required>
                                <option value="">اختر المستوى</option>
                                ${database.trainingLevels.map(level => 
                                    `<option value="${level.id}" ${subject && subject.level === level.id ? 'selected' : ''}>
                                        ${level.nameAr}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="subjectCoefficient" class="form-label">المعامل</label>
                            <input type="number" class="form-control" id="subjectCoefficient" 
                                   min="1" max="10" value="${subject ? subject.coefficient || 1 : 1}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="subjectEvaluationType" class="form-label">نوع التقييم</label>
                            <select class="form-select" id="subjectEvaluationType">
                                <option value="traditional" ${subject && subject.evaluationType === 'traditional' ? 'selected' : ''}>تقليدي</option>
                                <option value="continuous" ${subject && subject.evaluationType === 'continuous' ? 'selected' : ''}>مستمر</option>
                                <option value="project" ${subject && subject.evaluationType === 'project' ? 'selected' : ''}>مشروع</option>
                                <option value="practical" ${subject && subject.evaluationType === 'practical' ? 'selected' : ''}>عملي</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="subjectDescription" class="form-label">وصف المادة</label>
                    <textarea class="form-control" id="subjectDescription" rows="3">${subject ? subject.description || '' : ''}</textarea>
                </div>
                
                ${isEdit ? `<input type="hidden" id="subjectId" value="${subject.id}">` : ''}
                
                <div class="text-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">إلغاء</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${isEdit ? 'تحديث' : 'إضافة'}
                    </button>
                </div>
            </form>
        `;
    }

    showModal(title, content, size = 'md') {
        const modalId = 'dynamicModal';
        let modal = document.getElementById(modalId);
        
        if (modal) {
            modal.remove();
        }
        
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-${size}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        
        return modal;
    }

    async addSubject(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const subjectData = {
                name: document.getElementById('subjectName').value,
                code: document.getElementById('subjectCode').value,
                specialty: document.getElementById('subjectSpecialty').value,
                level: parseInt(document.getElementById('subjectLevel').value),
                coefficient: parseInt(document.getElementById('subjectCoefficient').value),
                evaluationType: document.getElementById('subjectEvaluationType').value,
                description: document.getElementById('subjectDescription').value
            };
            
            await database.addSubject(subjectData);
            
            app.showSuccess('تم إضافة المادة بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('dynamicModal')).hide();
            
            // إعادة تحميل البيانات
            await this.loadEvaluationData();
            
        } catch (error) {
            console.error('خطأ في إضافة المادة:', error);
            app.showError('خطأ في إضافة المادة');
        }
    }

    // المزيد من الوظائف...
    filterBySpecialty(specialty) {
        // تطبيق فلتر التخصص
    }

    filterByLevel(level) {
        // تطبيق فلتر المستوى
    }

    exportGrades() {
        // تصدير الدرجات إلى Excel
    }
}

// تصدير الكلاس
if (typeof window !== 'undefined') {
    window.EvaluationManager = EvaluationManager;
    window.evaluationManager = new EvaluationManager();
}