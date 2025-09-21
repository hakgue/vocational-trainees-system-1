/**
 * منصة إدارة المتدربين - إدارة المتدربين
 * وحدة شاملة لإدارة المتدربين مع دعم التخصصات الرسمية الجزائرية
 */

class TraineesManager {
    constructor() {
        this.currentTrainees = [];
        this.filteredTrainees = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.sortBy = 'registrationNumber';
        this.sortOrder = 'asc';
        this.filters = {
            specialty: '',
            level: '',
            group: '',
            status: '',
            search: ''
        };
        this.isLoading = false;
        this.totalTrainees = 0;
    }

    async init() {
        console.log('🎓 تهيئة وحدة إدارة المتدربين...');
        await this.createTraineesSection();
        await this.loadTrainees();
        this.setupEventListeners();
        console.log('✅ تم تهيئة وحدة إدارة المتدربين بنجاح');
    }

    async createTraineesSection() {
        const sectionElement = document.getElementById('trainees-section');
        if (!sectionElement) return;

        sectionElement.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-users text-primary"></i>
                    إدارة المتدربين
                </h1>
                <p class="page-subtitle">إضافة وتعديل وإدارة بيانات المتدربين وفقاً لمدونة التخصصات الرسمية</p>
            </div>

            <!-- شريط الأدوات والبحث -->
            <div class="card shadow-sm mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <button type="button" class="btn btn-primary btn-lg" onclick="traineesManager.showAddTraineeModal()">
                                <i class="fas fa-plus me-2"></i> إضافة متدرب جديد
                            </button>
                        </div>
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                                <input type="text" class="form-control form-control-lg" id="searchTrainees" 
                                       placeholder="البحث عن متدرب (الاسم، رقم التسجيل...)">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="btn-group w-100" role="group">
                                <button type="button" class="btn btn-outline-secondary" onclick="traineesManager.exportTrainees()">
                                    <i class="fas fa-download"></i> تصدير
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="traineesManager.showFiltersModal()">
                                    <i class="fas fa-filter"></i> فلترة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ملخص إحصائي -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-white bg-primary">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="card-title" id="totalTraineesCount">0</h4>
                                    <p class="card-text">إجمالي المتدربين</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-users fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-success">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="card-title" id="activeTraineesCount">0</h4>
                                    <p class="card-text">متدرب نشط</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-user-check fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-warning">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="card-title" id="specialtiesCount">0</h4>
                                    <p class="card-text">تخصص مختلف</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-graduation-cap fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-info">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 class="card-title" id="groupsCount">0</h4>
                                    <p class="card-text">مجموعة تدريبية</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-layer-group fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- جدول المتدربين -->
            <div class="card shadow-sm">
                <div class="card-header bg-light">
                    <div class="row align-items-center">
                        <div class="col">
                            <h5 class="card-title mb-0">قائمة المتدربين</h5>
                        </div>
                        <div class="col-auto">
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn btn-outline-secondary" onclick="traineesManager.sortTrainees('registrationNumber')">
                                    رقم التسجيل <i class="fas fa-sort"></i>
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="traineesManager.sortTrainees('fullName')">
                                    الاسم <i class="fas fa-sort"></i>
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="traineesManager.sortTrainees('specialty')">
                                    التخصص <i class="fas fa-sort"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <!-- Loading Spinner -->
                    <div id="traineesLoading" class="text-center p-4" style="display: none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">جاري التحميل...</span>
                        </div>
                        <p class="mt-2">جاري تحميل بيانات المتدربين...</p>
                    </div>

                    <!-- جدول البيانات -->
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="traineesTable">
                            <thead class="table-dark">
                                <tr>
                                    <th style="width: 80px;">الصورة</th>
                                    <th style="width: 120px;">رقم التسجيل</th>
                                    <th>الاسم الكامل</th>
                                    <th>التخصص</th>
                                    <th>المستوى</th>
                                    <th>المجموعة</th>
                                    <th>الحالة</th>
                                    <th style="width: 150px;">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="traineesTableBody">
                                <!-- سيتم ملء البيانات هنا ديناميكياً -->
                            </tbody>
                        </table>
                    </div>

                    <!-- رسالة عدم وجود بيانات -->
                    <div id="noTraineesMessage" class="text-center p-5" style="display: none;">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">لا توجد متدربين حالياً</h5>
                        <p class="text-muted">ابدأ بإضافة متدرب جديد لتظهر البيانات هنا</p>
                        <button type="button" class="btn btn-primary" onclick="traineesManager.showAddTraineeModal()">
                            <i class="fas fa-plus me-2"></i> إضافة متدرب جديد
                        </button>
                    </div>
                </div>

                <!-- التنقل بين الصفحات -->
                <div class="card-footer">
                    <div class="row align-items-center">
                        <div class="col">
                            <span class="text-muted">
                                عرض <span id="pageStartItem">0</span> إلى <span id="pageEndItem">0</span> 
                                من أصل <span id="totalItems">0</span> متدرب
                            </span>
                        </div>
                        <div class="col-auto">
                            <nav>
                                <ul class="pagination pagination-sm mb-0" id="traineesPagination">
                                    <!-- سيتم إنشاؤها ديناميكياً -->
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal إضافة/تعديل متدرب -->
            <div class="modal fade" id="traineeModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="traineeModalTitle">إضافة متدرب جديد</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="traineeForm" novalidate>
                                <div class="row">
                                    <!-- البيانات الشخصية -->
                                    <div class="col-12">
                                        <h6 class="text-primary mb-3">
                                            <i class="fas fa-user me-2"></i>البيانات الشخصية
                                        </h6>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="registrationNumber" class="form-label">رقم التسجيل *</label>
                                            <input type="text" class="form-control" id="registrationNumber" required>
                                            <div class="invalid-feedback">يرجى إدخال رقم التسجيل</div>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="fullName" class="form-label">الاسم الكامل *</label>
                                            <input type="text" class="form-control" id="fullName" required>
                                            <div class="invalid-feedback">يرجى إدخال الاسم الكامل</div>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="birthDate" class="form-label">تاريخ الميلاد</label>
                                            <input type="date" class="form-control" id="birthDate">
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="gender" class="form-label">الجنس</label>
                                            <select class="form-select" id="gender">
                                                <option value="">اختر الجنس</option>
                                                <option value="male">ذكر</option>
                                                <option value="female">أنثى</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="phone" class="form-label">رقم الهاتف</label>
                                            <input type="tel" class="form-control" id="phone">
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">البريد الإلكتروني</label>
                                            <input type="email" class="form-control" id="email">
                                        </div>
                                    </div>

                                    <div class="col-12">
                                        <div class="mb-3">
                                            <label for="address" class="form-label">العنوان</label>
                                            <textarea class="form-control" id="address" rows="2"></textarea>
                                        </div>
                                    </div>

                                    <!-- البيانات الأكاديمية -->
                                    <div class="col-12">
                                        <hr>
                                        <h6 class="text-primary mb-3">
                                            <i class="fas fa-graduation-cap me-2"></i>البيانات الأكاديمية
                                        </h6>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="specialty" class="form-label">التخصص *</label>
                                            <select class="form-select" id="specialty" required>
                                                <option value="">اختر التخصص</option>
                                                <!-- سيتم ملؤها ديناميكياً -->
                                            </select>
                                            <div class="invalid-feedback">يرجى اختيار التخصص</div>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="level" class="form-label">المستوى *</label>
                                            <select class="form-select" id="level" required>
                                                <option value="">اختر المستوى</option>
                                                <!-- سيتم ملؤها ديناميكياً -->
                                            </select>
                                            <div class="invalid-feedback">يرجى اختيار المستوى</div>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="group" class="form-label">المجموعة *</label>
                                            <input type="text" class="form-control" id="group" placeholder="مثال: G1, G2, A1" required>
                                            <div class="invalid-feedback">يرجى إدخال المجموعة</div>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="status" class="form-label">الحالة</label>
                                            <select class="form-select" id="status">
                                                <option value="active">نشط</option>
                                                <option value="inactive">غير نشط</option>
                                                <option value="graduated">تخرج</option>
                                                <option value="suspended">موقوف</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="enrollmentDate" class="form-label">تاريخ التسجيل</label>
                                            <input type="date" class="form-control" id="enrollmentDate">
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="graduationDate" class="form-label">تاريخ التخرج المتوقع</label>
                                            <input type="date" class="form-control" id="graduationDate">
                                        </div>
                                    </div>

                                    <div class="col-12">
                                        <div class="mb-3">
                                            <label for="notes" class="form-label">ملاحظات</label>
                                            <textarea class="form-control" id="notes" rows="3"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-primary" onclick="traineesManager.saveTrainee()">
                                <i class="fas fa-save me-2"></i>حفظ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal الفلترة -->
            <div class="modal fade" id="filtersModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">فلترة المتدربين</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="filterSpecialty" class="form-label">التخصص</label>
                                <select class="form-select" id="filterSpecialty">
                                    <option value="">جميع التخصصات</option>
                                    <!-- سيتم ملؤها ديناميكياً -->
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="filterLevel" class="form-label">المستوى</label>
                                <select class="form-select" id="filterLevel">
                                    <option value="">جميع المستويات</option>
                                    <!-- سيتم ملؤها ديناميكياً -->
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="filterGroup" class="form-label">المجموعة</label>
                                <select class="form-select" id="filterGroup">
                                    <option value="">جميع المجموعات</option>
                                    <!-- سيتم ملؤها ديناميكياً -->
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="filterStatus" class="form-label">الحالة</label>
                                <select class="form-select" id="filterStatus">
                                    <option value="">جميع الحالات</option>
                                    <option value="active">نشط</option>
                                    <option value="inactive">غير نشط</option>
                                    <option value="graduated">تخرج</option>
                                    <option value="suspended">موقوف</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="traineesManager.clearFilters()">مسح الفلاتر</button>
                            <button type="button" class="btn btn-primary" onclick="traineesManager.applyFilters()">تطبيق</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadTrainees() {
        try {
            this.showLoading(true);
            this.currentTrainees = await database.getAllTrainees();
            this.applyFiltersAndSort();
            this.updateStatistics();
            this.showLoading(false);
        } catch (error) {
            console.error('خطأ في تحميل المتدربين:', error);
            app.showNotification('خطأ في تحميل بيانات المتدربين', 'error');
            this.showLoading(false);
        }
    }

    applyFiltersAndSort() {
        // تطبيق الفلاتر
        this.filteredTrainees = this.currentTrainees.filter(trainee => {
            const matchesSearch = !this.filters.search || 
                trainee.fullName.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                trainee.registrationNumber.toLowerCase().includes(this.filters.search.toLowerCase());
                
            const matchesSpecialty = !this.filters.specialty || trainee.specialty === this.filters.specialty;
            const matchesLevel = !this.filters.level || trainee.level === this.filters.level;
            const matchesGroup = !this.filters.group || trainee.group === this.filters.group;
            const matchesStatus = !this.filters.status || trainee.status === this.filters.status;

            return matchesSearch && matchesSpecialty && matchesLevel && matchesGroup && matchesStatus;
        });

        // تطبيق الترتيب
        this.filteredTrainees.sort((a, b) => {
            let valueA = a[this.sortBy];
            let valueB = b[this.sortBy];

            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            let comparison = 0;
            if (valueA > valueB) comparison = 1;
            if (valueA < valueB) comparison = -1;

            return this.sortOrder === 'desc' ? comparison * -1 : comparison;
        });

        this.totalTrainees = this.filteredTrainees.length;
        this.currentPage = 1;
        this.renderTrainees();
        this.renderPagination();
    }

    renderTrainees() {
        const tbody = document.getElementById('traineesTableBody');
        const noDataMessage = document.getElementById('noTraineesMessage');

        if (this.filteredTrainees.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredTrainees.length);
        const pageTrainees = this.filteredTrainees.slice(startIndex, endIndex);

        tbody.innerHTML = pageTrainees.map(trainee => `
            <tr>
                <td>
                    <div class="avatar-circle">
                        ${trainee.fullName.charAt(0)}
                    </div>
                </td>
                <td>
                    <span class="badge bg-secondary">${trainee.registrationNumber}</span>
                </td>
                <td>
                    <strong>${trainee.fullName}</strong>
                    ${trainee.phone ? `<br><small class="text-muted">${trainee.phone}</small>` : ''}
                </td>
                <td>
                    <span class="text-primary">${this.getSpecialtyName(trainee.specialty)}</span>
                </td>
                <td>
                    <span class="badge bg-info">${this.getLevelName(trainee.level)}</span>
                </td>
                <td>
                    <span class="badge bg-warning">${trainee.group}</span>
                </td>
                <td>
                    ${this.getStatusBadge(trainee.status)}
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" 
                                onclick="traineesManager.editTrainee(${trainee.id})" 
                                title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info" 
                                onclick="traineesManager.viewTrainee(${trainee.id})" 
                                title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" 
                                onclick="traineesManager.deleteTrainee(${trainee.id})" 
                                title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // تحديث معلومات الصفحة
        document.getElementById('pageStartItem').textContent = startIndex + 1;
        document.getElementById('pageEndItem').textContent = endIndex;
        document.getElementById('totalItems').textContent = this.totalTrainees;
    }

    renderPagination() {
        const pagination = document.getElementById('traineesPagination');
        const totalPages = Math.ceil(this.totalTrainees / this.itemsPerPage);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // زر السابق
        if (this.currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="traineesManager.goToPage(${this.currentPage - 1})">السابق</a>
                </li>
            `;
        }

        // أرقام الصفحات
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="traineesManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // زر التالي
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="traineesManager.goToPage(${this.currentPage + 1})">التالي</a>
                </li>
            `;
        }

        pagination.innerHTML = paginationHTML;
    }

    setupEventListeners() {
        // البحث
        const searchInput = document.getElementById('searchTrainees');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFiltersAndSort();
            });
        }

        // تحميل البيانات للنماذج
        this.loadFormData();
    }

    async loadFormData() {
        // تحميل التخصصات
        const branches = database.getProfessionalBranches();
        const specialtySelect = document.getElementById('specialty');
        const filterSpecialtySelect = document.getElementById('filterSpecialty');

        const specialtyOptions = branches.map(branch => 
            `<option value="${branch.id}">${branch.name}</option>`
        ).join('');

        if (specialtySelect) specialtySelect.innerHTML += specialtyOptions;
        if (filterSpecialtySelect) filterSpecialtySelect.innerHTML += specialtyOptions;

        // تحميل المستويات
        const levels = database.getTrainingLevels();
        const levelSelect = document.getElementById('level');
        const filterLevelSelect = document.getElementById('filterLevel');

        const levelOptions = levels.map(level => 
            `<option value="${level.id}">${level.name}</option>`
        ).join('');

        if (levelSelect) levelSelect.innerHTML += levelOptions;
        if (filterLevelSelect) filterLevelSelect.innerHTML += levelOptions;

        // تحميل المجموعات الموجودة
        this.loadGroups();
    }

    async loadGroups() {
        const uniqueGroups = [...new Set(this.currentTrainees.map(t => t.group).filter(g => g))];
        const filterGroupSelect = document.getElementById('filterGroup');
        
        if (filterGroupSelect) {
            const groupOptions = uniqueGroups.map(group => 
                `<option value="${group}">${group}</option>`
            ).join('');
            filterGroupSelect.innerHTML = '<option value="">جميع المجموعات</option>' + groupOptions;
        }
    }

    updateStatistics() {
        const total = this.currentTrainees.length;
        const active = this.currentTrainees.filter(t => t.status === 'active').length;
        const specialties = new Set(this.currentTrainees.map(t => t.specialty)).size;
        const groups = new Set(this.currentTrainees.map(t => t.group)).size;

        document.getElementById('totalTraineesCount').textContent = total;
        document.getElementById('activeTraineesCount').textContent = active;
        document.getElementById('specialtiesCount').textContent = specialties;
        document.getElementById('groupsCount').textContent = groups;
    }

    showLoading(show) {
        const loading = document.getElementById('traineesLoading');
        const table = document.getElementById('traineesTable');
        
        if (loading && table) {
            loading.style.display = show ? 'block' : 'none';
            table.style.display = show ? 'none' : 'table';
        }
        
        this.isLoading = show;
    }

    // ==========================================
    // العمليات الأساسية
    // ==========================================

    showAddTraineeModal() {
        const modal = new bootstrap.Modal(document.getElementById('traineeModal'));
        document.getElementById('traineeModalTitle').textContent = 'إضافة متدرب جديد';
        document.getElementById('traineeForm').reset();
        
        // تعيين تاريخ التسجيل الافتراضي
        document.getElementById('enrollmentDate').value = new Date().toISOString().split('T')[0];
        
        modal.show();
    }

    async saveTrainee() {
        const form = document.getElementById('traineeForm');
        
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        try {
            const traineeData = {
                registrationNumber: document.getElementById('registrationNumber').value,
                fullName: document.getElementById('fullName').value,
                birthDate: document.getElementById('birthDate').value,
                gender: document.getElementById('gender').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                specialty: document.getElementById('specialty').value,
                level: document.getElementById('level').value,
                group: document.getElementById('group').value,
                status: document.getElementById('status').value || 'active',
                enrollmentDate: document.getElementById('enrollmentDate').value,
                graduationDate: document.getElementById('graduationDate').value,
                notes: document.getElementById('notes').value
            };

            // التحقق من عدم تكرار رقم التسجيل
            const existingTrainee = this.currentTrainees.find(t => 
                t.registrationNumber === traineeData.registrationNumber
            );
            
            if (existingTrainee) {
                app.showNotification('رقم التسجيل موجود مسبقاً', 'error');
                return;
            }

            await database.addTrainee(traineeData);
            
            // إغلاق النموذج وإعادة تحميل البيانات
            bootstrap.Modal.getInstance(document.getElementById('traineeModal')).hide();
            await this.loadTrainees();
            
            app.showNotification('تم إضافة المتدرب بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ المتدرب:', error);
            app.showNotification('خطأ في حفظ بيانات المتدرب', 'error');
        }
    }

    async editTrainee(id) {
        const trainee = this.currentTrainees.find(t => t.id === id);
        if (!trainee) return;

        // ملء النموذج بالبيانات
        document.getElementById('registrationNumber').value = trainee.registrationNumber || '';
        document.getElementById('fullName').value = trainee.fullName || '';
        document.getElementById('birthDate').value = trainee.birthDate || '';
        document.getElementById('gender').value = trainee.gender || '';
        document.getElementById('phone').value = trainee.phone || '';
        document.getElementById('email').value = trainee.email || '';
        document.getElementById('address').value = trainee.address || '';
        document.getElementById('specialty').value = trainee.specialty || '';
        document.getElementById('level').value = trainee.level || '';
        document.getElementById('group').value = trainee.group || '';
        document.getElementById('status').value = trainee.status || '';
        document.getElementById('enrollmentDate').value = trainee.enrollmentDate || '';
        document.getElementById('graduationDate').value = trainee.graduationDate || '';
        document.getElementById('notes').value = trainee.notes || '';

        // تحديث عنوان النموذج
        document.getElementById('traineeModalTitle').textContent = 'تعديل بيانات المتدرب';
        
        const modal = new bootstrap.Modal(document.getElementById('traineeModal'));
        modal.show();
    }

    async deleteTrainee(id) {
        const trainee = this.currentTrainees.find(t => t.id === id);
        if (!trainee) return;

        const confirmed = await app.showConfirmDialog(
            'حذف المتدرب',
            `هل أنت متأكد من حذف المتدرب "${trainee.fullName}"؟\nهذا الإجراء لا يمكن التراجع عنه.`
        );

        if (!confirmed) return;

        try {
            await database.deleteTrainee(id);
            await this.loadTrainees();
            app.showNotification('تم حذف المتدرب بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف المتدرب:', error);
            app.showNotification('خطأ في حذف المتدرب', 'error');
        }
    }

    viewTrainee(id) {
        // سيتم تنفيذها لاحقاً - صفحة تفاصيل المتدرب
        console.log('عرض تفاصيل المتدرب:', id);
    }

    // ==========================================
    // الفلترة والترتيب
    // ==========================================

    showFiltersModal() {
        const modal = new bootstrap.Modal(document.getElementById('filtersModal'));
        
        // تحديث القيم الحالية
        document.getElementById('filterSpecialty').value = this.filters.specialty;
        document.getElementById('filterLevel').value = this.filters.level;
        document.getElementById('filterGroup').value = this.filters.group;
        document.getElementById('filterStatus').value = this.filters.status;
        
        modal.show();
    }

    applyFilters() {
        this.filters.specialty = document.getElementById('filterSpecialty').value;
        this.filters.level = document.getElementById('filterLevel').value;
        this.filters.group = document.getElementById('filterGroup').value;
        this.filters.status = document.getElementById('filterStatus').value;

        bootstrap.Modal.getInstance(document.getElementById('filtersModal')).hide();
        this.applyFiltersAndSort();
    }

    clearFilters() {
        this.filters = {
            specialty: '',
            level: '',
            group: '',
            status: '',
            search: ''
        };

        document.getElementById('searchTrainees').value = '';
        document.getElementById('filterSpecialty').value = '';
        document.getElementById('filterLevel').value = '';
        document.getElementById('filterGroup').value = '';
        document.getElementById('filterStatus').value = '';

        this.applyFiltersAndSort();
    }

    sortTrainees(field) {
        if (this.sortBy === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortOrder = 'asc';
        }

        this.applyFiltersAndSort();
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTrainees();
        this.renderPagination();
    }

    // ==========================================
    // وظائف مساعدة
    // ==========================================

    getSpecialtyName(specialtyId) {
        const branch = database.getBranchById(specialtyId);
        return branch ? branch.name : specialtyId;
    }

    getLevelName(levelId) {
        const level = database.getLevelById(levelId);
        return level ? level.name : levelId;
    }

    getStatusBadge(status) {
        const statusMap = {
            'active': '<span class="badge bg-success">نشط</span>',
            'inactive': '<span class="badge bg-secondary">غير نشط</span>',
            'graduated': '<span class="badge bg-primary">تخرج</span>',
            'suspended': '<span class="badge bg-danger">موقوف</span>'
        };
        
        return statusMap[status] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    async exportTrainees() {
        try {
            // سيتم تنفيذها لاحقاً - تصدير Excel
            app.showNotification('جاري تطوير ميزة التصدير', 'info');
        } catch (error) {
            console.error('خطأ في التصدير:', error);
            app.showNotification('خطأ في تصدير البيانات', 'error');
        }
    }
}

// إنشاء مثيل وحيد
const traineesManager = new TraineesManager();

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.traineesManager = traineesManager;
}
