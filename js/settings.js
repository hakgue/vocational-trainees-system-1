/**
 * منصة إدارة المتدربين - إدارة الإعدادات
 * إعدادات النظام والمؤسسة والمستخدم
 */

class SettingsManager {
    constructor() {
        this.currentSettings = {};
        this.institutionSettings = {};
        this.systemSettings = {};
        this.userPreferences = {};
        
        this.defaultSettings = {
            // إعدادات المؤسسة
            institutionName: 'مركز التكوين المهني',
            institutionAddress: 'الجزائر',
            institutionPhone: '',
            institutionEmail: '',
            institutionLogo: '',
            academicYear: '2024-2025',
            
            // إعدادات الحضور
            periodsPerDay: 2,
            period1StartTime: '08:00',
            period1EndTime: '12:00',
            period2StartTime: '13:00',
            period2EndTime: '17:00',
            lateThresholdMinutes: 15,
            allowLateEntry: true,
            
            // إعدادات التقييم
            gradeScale: 20,
            passingGrade: 10,
            excellentGrade: 18,
            goodGrade: 16,
            satisfactoryGrade: 14,
            
            // إعدادات النظام
            language: 'ar',
            theme: 'light',
            autoSave: true,
            notifications: true,
            syncInterval: 300000,
            maxFileSize: 5242880, // 5MB
            allowedFileTypes: ['pdf', 'xlsx', 'docx', 'jpg', 'png'],
            
            // إعدادات النسخ الاحتياطي
            autoBackup: true,
            backupInterval: 86400000, // 24 hours
            maxBackups: 10,
            
            // إعدادات الأمان
            sessionTimeout: 3600000, // 1 hour
            passwordStrength: 'medium',
            enableAuditLog: true
        };
    }

    async init() {
        await this.createSettingsSection();
        await this.loadAllSettings();
        this.setupEventListeners();
    }

    async createSettingsSection() {
        const sectionElement = document.getElementById('settings-section');
        if (!sectionElement) return;

        sectionElement.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-cog text-primary"></i>
                    إعدادات النظام
                </h1>
                <p class="page-subtitle">إدارة إعدادات المؤسسة والنظام والمستخدم</p>
            </div>

            <!-- أزرار الحفظ والاستعادة -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-primary" onclick="settingsManager.saveAllSettings()">
                                    <i class="fas fa-save"></i> حفظ جميع الإعدادات
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="settingsManager.resetToDefaults()">
                                    <i class="fas fa-undo"></i> استعادة الافتراضية
                                </button>
                                <button type="button" class="btn btn-info" onclick="settingsManager.exportSettings()">
                                    <i class="fas fa-download"></i> تصدير الإعدادات
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <div class="d-flex gap-2 justify-content-end">
                                <input type="file" id="importSettingsFile" accept=".json" style="display: none;" 
                                       onchange="settingsManager.importSettings(event)">
                                <button type="button" class="btn btn-outline-primary" 
                                        onclick="document.getElementById('importSettingsFile').click()">
                                    <i class="fas fa-upload"></i> استيراد الإعدادات
                                </button>
                                <button type="button" class="btn btn-success" onclick="settingsManager.createBackup()">
                                    <i class="fas fa-shield-alt"></i> نسخة احتياطية
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- التبويبات -->
            <div class="card">
                <div class="card-header">
                    <ul class="nav nav-tabs card-header-tabs" id="settingsTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="institution-tab" data-bs-toggle="tab" 
                                    data-bs-target="#institution-settings" type="button" role="tab">
                                <i class="fas fa-building"></i> إعدادات المؤسسة
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="attendance-tab" data-bs-toggle="tab" 
                                    data-bs-target="#attendance-settings" type="button" role="tab">
                                <i class="fas fa-calendar-check"></i> إعدادات الحضور
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="evaluation-tab" data-bs-toggle="tab" 
                                    data-bs-target="#evaluation-settings" type="button" role="tab">
                                <i class="fas fa-chart-line"></i> إعدادات التقييم
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="system-tab" data-bs-toggle="tab" 
                                    data-bs-target="#system-settings" type="button" role="tab">
                                <i class="fas fa-cogs"></i> إعدادات النظام
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="backup-tab" data-bs-toggle="tab" 
                                    data-bs-target="#backup-settings" type="button" role="tab">
                                <i class="fas fa-cloud-upload-alt"></i> النسخ الاحتياطي
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="about-tab" data-bs-toggle="tab" 
                                    data-bs-target="#about-system" type="button" role="tab">
                                <i class="fas fa-info-circle"></i> حول النظام
                            </button>
                        </li>
                    </ul>
                </div>
                <div class="card-body">
                    <div class="tab-content" id="settingsTabContent">
                        <!-- إعدادات المؤسسة -->
                        <div class="tab-pane fade show active" id="institution-settings" role="tabpanel">
                            <form id="institutionForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="institutionName" class="form-label">اسم المؤسسة</label>
                                            <input type="text" class="form-control" id="institutionName" 
                                                   placeholder="مركز التكوين المهني">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="academicYear" class="form-label">السنة الدراسية</label>
                                            <input type="text" class="form-control" id="academicYear" 
                                                   placeholder="2024-2025">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="institutionPhone" class="form-label">رقم الهاتف</label>
                                            <input type="tel" class="form-control" id="institutionPhone" 
                                                   placeholder="+213 XX XX XX XX">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="institutionEmail" class="form-label">البريد الإلكتروني</label>
                                            <input type="email" class="form-control" id="institutionEmail" 
                                                   placeholder="info@institution.dz">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="institutionAddress" class="form-label">عنوان المؤسسة</label>
                                    <textarea class="form-control" id="institutionAddress" rows="3" 
                                              placeholder="العنوان الكامل للمؤسسة"></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="institutionLogo" class="form-label">شعار المؤسسة</label>
                                    <input type="file" class="form-control" id="institutionLogo" 
                                           accept="image/*" onchange="settingsManager.previewLogo(event)">
                                    <div class="mt-2" id="logoPreview"></div>
                                </div>
                            </form>
                        </div>

                        <!-- إعدادات الحضور -->
                        <div class="tab-pane fade" id="attendance-settings" role="tabpanel">
                            <form id="attendanceForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-primary mb-3">الفترة الأولى</h6>
                                        <div class="row">
                                            <div class="col-6">
                                                <div class="mb-3">
                                                    <label for="period1StartTime" class="form-label">وقت البداية</label>
                                                    <input type="time" class="form-control" id="period1StartTime">
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="mb-3">
                                                    <label for="period1EndTime" class="form-label">وقت النهاية</label>
                                                    <input type="time" class="form-control" id="period1EndTime">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <h6 class="text-primary mb-3">الفترة الثانية</h6>
                                        <div class="row">
                                            <div class="col-6">
                                                <div class="mb-3">
                                                    <label for="period2StartTime" class="form-label">وقت البداية</label>
                                                    <input type="time" class="form-control" id="period2StartTime">
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="mb-3">
                                                    <label for="period2EndTime" class="form-label">وقت النهاية</label>
                                                    <input type="time" class="form-control" id="period2EndTime">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="lateThresholdMinutes" class="form-label">حد التأخير (بالدقائق)</label>
                                            <input type="number" class="form-control" id="lateThresholdMinutes" 
                                                   min="1" max="60" placeholder="15">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">خيارات الحضور</label>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="allowLateEntry">
                                                <label class="form-check-label" for="allowLateEntry">
                                                    السماح بالدخول المتأخر
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <!-- إعدادات التقييم -->
                        <div class="tab-pane fade" id="evaluation-settings" role="tabpanel">
                            <form id="evaluationForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="gradeScale" class="form-label">السلم الدراسي</label>
                                            <select class="form-select" id="gradeScale">
                                                <option value="20">من 20</option>
                                                <option value="100">من 100</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="passingGrade" class="form-label">النقطة المطلوبة للنجاح</label>
                                            <input type="number" class="form-control" id="passingGrade" 
                                                   min="1" placeholder="10">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="excellentGrade" class="form-label">ممتاز</label>
                                            <input type="number" class="form-control" id="excellentGrade" 
                                                   min="1" placeholder="18">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="goodGrade" class="form-label">جيد جداً</label>
                                            <input type="number" class="form-control" id="goodGrade" 
                                                   min="1" placeholder="16">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="satisfactoryGrade" class="form-label">مقبول</label>
                                            <input type="number" class="form-control" id="satisfactoryGrade" 
                                                   min="1" placeholder="14">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i>
                                    <strong>ملاحظة:</strong> هذه الإعدادات تؤثر على جميع التقييمات في النظام.
                                </div>
                            </form>
                        </div>

                        <!-- إعدادات النظام -->
                        <div class="tab-pane fade" id="system-settings" role="tabpanel">
                            <form id="systemForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="language" class="form-label">لغة النظام</label>
                                            <select class="form-select" id="language">
                                                <option value="ar">العربية</option>
                                                <option value="fr">Français</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="theme" class="form-label">مظهر النظام</label>
                                            <select class="form-select" id="theme">
                                                <option value="light">فاتح</option>
                                                <option value="dark">داكن</option>
                                                <option value="auto">تلقائي</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="syncInterval" class="form-label">فترة المزامنة (ثانية)</label>
                                            <input type="number" class="form-control" id="syncInterval" 
                                                   min="60" max="3600" placeholder="300">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="maxFileSize" class="form-label">أقصى حجم للملف (MB)</label>
                                            <input type="number" class="form-control" id="maxFileSize" 
                                                   min="1" max="100" placeholder="5">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">خيارات النظام</label>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="autoSave">
                                                <label class="form-check-label" for="autoSave">
                                                    الحفظ التلقائي
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="notifications">
                                                <label class="form-check-label" for="notifications">
                                                    الإشعارات
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="enableAuditLog">
                                                <label class="form-check-label" for="enableAuditLog">
                                                    سجل العمليات
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <!-- إعدادات النسخ الاحتياطي -->
                        <div class="tab-pane fade" id="backup-settings" role="tabpanel">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">إعدادات النسخ الاحتياطي</h6>
                                        </div>
                                        <div class="card-body">
                                            <form id="backupForm">
                                                <div class="mb-3">
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="checkbox" id="autoBackup">
                                                        <label class="form-check-label" for="autoBackup">
                                                            تفعيل النسخ الاحتياطي التلقائي
                                                        </label>
                                                    </div>
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label for="backupInterval" class="form-label">فترة النسخ (ساعات)</label>
                                                    <select class="form-select" id="backupInterval">
                                                        <option value="6">كل 6 ساعات</option>
                                                        <option value="12">كل 12 ساعة</option>
                                                        <option value="24">يومياً</option>
                                                        <option value="168">أسبوعياً</option>
                                                    </select>
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label for="maxBackups" class="form-label">أقصى عدد نسخ احتياطية</label>
                                                    <input type="number" class="form-control" id="maxBackups" 
                                                           min="1" max="50" placeholder="10">
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">النسخ الاحتياطية المتاحة</h6>
                                        </div>
                                        <div class="card-body">
                                            <div id="backupsList">
                                                <!-- سيتم ملؤها بقائمة النسخ الاحتياطية -->
                                            </div>
                                            
                                            <div class="d-grid gap-2 mt-3">
                                                <button type="button" class="btn btn-primary" 
                                                        onclick="settingsManager.createManualBackup()">
                                                    <i class="fas fa-plus"></i> إنشاء نسخة احتياطية الآن
                                                </button>
                                                <button type="button" class="btn btn-success" 
                                                        onclick="settingsManager.downloadAllData()">
                                                    <i class="fas fa-download"></i> تحميل جميع البيانات
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- حول النظام -->
                        <div class="tab-pane fade" id="about-system" role="tabpanel">
                            <div class="row">
                                <div class="col-md-8 mx-auto">
                                    <div class="text-center mb-4">
                                        <img src="./assets/logo.png" alt="شعار النظام" class="mb-3" style="max-width: 100px;">
                                        <h3>منصة إدارة المتدربين</h3>
                                        <p class="text-muted">نظام شامل لإدارة المتدربين والحضور والدرجات</p>
                                    </div>
                                    
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="row text-center">
                                                <div class="col-md-4">
                                                    <h5>الإصدار</h5>
                                                    <p class="text-primary">1.0.0</p>
                                                </div>
                                                <div class="col-md-4">
                                                    <h5>تاريخ الإصدار</h5>
                                                    <p class="text-primary">2025-01-01</p>
                                                </div>
                                                <div class="col-md-4">
                                                    <h5>المطور</h5>
                                                    <p class="text-primary">MiniMax Agent</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="card mt-4">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">معلومات النظام</h6>
                                        </div>
                                        <div class="card-body">
                                            <div id="systemInfo">
                                                <!-- سيتم ملؤها بمعلومات النظام -->
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="card mt-4">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">الميزات الرئيسية</h6>
                                        </div>
                                        <div class="card-body">
                                            <ul class="list-unstyled">
                                                <li><i class="fas fa-check text-success"></i> إدارة شاملة للمتدربين</li>
                                                <li><i class="fas fa-check text-success"></i> نظام حضور وغياب متقدم</li>
                                                <li><i class="fas fa-check text-success"></i> إدارة الدرجات والتقييمات</li>
                                                <li><i class="fas fa-check text-success"></i> تقارير مفصلة وتصدير البيانات</li>
                                                <li><i class="fas fa-check text-success"></i> يعمل دون اتصال بالإنترنت</li>
                                                <li><i class="fas fa-check text-success"></i> واجهة عربية كاملة</li>
                                                <li><i class="fas fa-check text-success"></i> نسخ احتياطي تلقائي</li>
                                            </ul>
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
        // مراقبة تغيير الحقول
        const forms = ['institutionForm', 'attendanceForm', 'evaluationForm', 'systemForm', 'backupForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.addEventListener('change', () => {
                        this.markSettingsAsChanged();
                    });
                });
            }
        });

        // مراقبة تغيير السلم الدراسي
        const gradeScaleSelect = document.getElementById('gradeScale');
        if (gradeScaleSelect) {
            gradeScaleSelect.addEventListener('change', (e) => {
                this.updateGradeInputs(parseInt(e.target.value));
            });
        }

        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveAllSettings();
            }
        });
    }

    async loadAllSettings() {
        try {
            // تحميل الإعدادات من قاعدة البيانات
            const savedSettings = await database.getAllSettings();
            
            // دمج الإعدادات مع القيم الافتراضية
            this.currentSettings = { ...this.defaultSettings, ...savedSettings };
            
            // تطبيق الإعدادات على الواجهة
            this.populateSettingsForm();
            
            // تحميل معلومات النظام
            this.loadSystemInfo();
            
            // تحميل النسخ الاحتياطية
            this.loadBackupsList();
            
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات:', error);
            app.showError('خطأ في تحميل الإعدادات');
        }
    }

    populateSettingsForm() {
        // ملء النماذج بالقيم المحفوظة
        Object.entries(this.currentSettings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        // تحديث حقول الدرجات حسب السلم المختار
        const gradeScale = this.currentSettings.gradeScale || 20;
        this.updateGradeInputs(gradeScale);
    }

    updateGradeInputs(scale) {
        const gradeInputs = ['passingGrade', 'excellentGrade', 'goodGrade', 'satisfactoryGrade'];
        gradeInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.max = scale;
                // تحديث القيم بناءً على السلم الجديد
                if (scale === 100) {
                    const currentValue = parseInt(input.value) || 0;
                    if (currentValue <= 20) {
                        input.value = currentValue * 5; // تحويل من 20 إلى 100
                    }
                } else {
                    const currentValue = parseInt(input.value) || 0;
                    if (currentValue > 20) {
                        input.value = Math.round(currentValue / 5); // تحويل من 100 إلى 20
                    }
                }
            }
        });
    }

    markSettingsAsChanged() {
        // إضافة مؤشر للتغييرات غير المحفوظة
        const saveButton = document.querySelector('[onclick="settingsManager.saveAllSettings()"]');
        if (saveButton && !saveButton.classList.contains('btn-warning')) {
            saveButton.classList.remove('btn-primary');
            saveButton.classList.add('btn-warning');
            saveButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> حفظ التغييرات';
        }
    }

    async saveAllSettings() {
        try {
            // جمع جميع الإعدادات من النماذج
            const newSettings = this.collectSettingsFromForms();
            
            // حفظ الإعدادات في قاعدة البيانات
            for (const [key, value] of Object.entries(newSettings)) {
                await database.saveSetting(key, value);
            }
            
            // تحديث الإعدادات المحلية
            this.currentSettings = { ...this.currentSettings, ...newSettings };
            
            // تطبيق الإعدادات على التطبيق
            this.applySettings(newSettings);
            
            // إعادة تعيين زر الحفظ
            const saveButton = document.querySelector('[onclick="settingsManager.saveAllSettings()"]');
            if (saveButton) {
                saveButton.classList.remove('btn-warning');
                saveButton.classList.add('btn-primary');
                saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ جميع الإعدادات';
            }
            
            app.showSuccess('تم حفظ الإعدادات بنجاح');
            
        } catch (error) {
            console.error('خطأ في حفظ الإعدادات:', error);
            app.showError('خطأ في حفظ الإعدادات');
        }
    }

    collectSettingsFromForms() {
        const settings = {};
        
        // جمع الإعدادات من جميع النماذج
        const inputs = document.querySelectorAll('#settingsTabContent input, #settingsTabContent select, #settingsTabContent textarea');
        
        inputs.forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox') {
                    settings[input.id] = input.checked;
                } else if (input.type === 'number') {
                    settings[input.id] = parseInt(input.value) || 0;
                } else {
                    settings[input.id] = input.value;
                }
            }
        });
        
        return settings;
    }

    applySettings(settings) {
        // تطبيق الإعدادات على التطبيق
        if (settings.theme) {
            this.applyTheme(settings.theme);
        }
        
        if (settings.language) {
            this.applyLanguage(settings.language);
        }
        
        if (app && app.config) {
            app.config = { ...app.config, ...settings };
        }
    }

    applyTheme(theme) {
        const body = document.body;
        body.className = body.className.replace(/theme-\w+/g, '');
        
        if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                body.classList.add('theme-dark');
            }
        }
    }

    applyLanguage(language) {
        document.documentElement.lang = language;
        if (language === 'ar') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    }

    async resetToDefaults() {
        if (confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية؟ سيتم فقدان جميع التغييرات الحالية.')) {
            try {
                // استعادة الإعدادات الافتراضية
                this.currentSettings = { ...this.defaultSettings };
                
                // حفظ الإعدادات الافتراضية في قاعدة البيانات
                for (const [key, value] of Object.entries(this.defaultSettings)) {
                    await database.saveSetting(key, value);
                }
                
                // إعادة ملء النماذج
                this.populateSettingsForm();
                
                app.showSuccess('تم استعادة الإعدادات الافتراضية بنجاح');
                
            } catch (error) {
                console.error('خطأ في استعادة الإعدادات:', error);
                app.showError('خطأ في استعادة الإعدادات');
            }
        }
    }

    exportSettings() {
        try {
            const settingsBlob = new Blob([JSON.stringify(this.currentSettings, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(settingsBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `settings_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            app.showSuccess('تم تصدير الإعدادات بنجاح');
            
        } catch (error) {
            console.error('خطأ في تصدير الإعدادات:', error);
            app.showError('خطأ في تصدير الإعدادات');
        }
    }

    async importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const importedSettings = JSON.parse(text);
            
            // التحقق من صحة الإعدادات
            if (this.validateImportedSettings(importedSettings)) {
                this.currentSettings = { ...this.currentSettings, ...importedSettings };
                this.populateSettingsForm();
                this.markSettingsAsChanged();
                
                app.showSuccess('تم استيراد الإعدادات بنجاح');
            } else {
                app.showError('ملف الإعدادات غير صحيح');
            }
            
        } catch (error) {
            console.error('خطأ في استيراد الإعدادات:', error);
            app.showError('خطأ في قراءة ملف الإعدادات');
        }
        
        // إعادة تعيين حقل الملف
        event.target.value = '';
    }

    validateImportedSettings(settings) {
        // التحقق الأساسي من صحة الإعدادات
        return typeof settings === 'object' && settings !== null;
    }

    previewLogo(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('logoPreview');
        
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="معاينة الشعار" 
                         style="max-width: 200px; max-height: 100px;" class="img-thumbnail">
                `;
            };
            reader.readAsDataURL(file);
        }
    }

    loadSystemInfo() {
        const systemInfo = document.getElementById('systemInfo');
        if (systemInfo) {
            const info = {
                'نظام التشغيل': navigator.platform,
                'المتصفح': navigator.userAgent.split(' ')[0],
                'الدقة': `${screen.width}x${screen.height}`,
                'المنطقة الزمنية': Intl.DateTimeFormat().resolvedOptions().timeZone,
                'اللغة': navigator.language,
                'الذاكرة المتاحة': navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'غير محدد',
                'الاتصال': navigator.onLine ? 'متصل' : 'غير متصل'
            };
            
            systemInfo.innerHTML = Object.entries(info).map(([key, value]) => `
                <div class="d-flex justify-content-between border-bottom py-2">
                    <strong>${key}:</strong>
                    <span>${value}</span>
                </div>
            `).join('');
        }
    }

    loadBackupsList() {
        const backupsList = document.getElementById('backupsList');
        if (backupsList) {
            // في التطبيق الحقيقي، سيتم جلب قائمة النسخ من LocalStorage أو IndexedDB
            backupsList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-archive fa-2x mb-2"></i>
                    <p>لا توجد نسخ احتياطية حتى الآن</p>
                </div>
            `;
        }
    }

    async createBackup() {
        try {
            // إنشاء نسخة احتياطية شاملة
            const backupData = await this.createBackupData();
            
            // حفظ النسخة الاحتياطية
            const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(backupBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            app.showSuccess('تم إنشاء النسخة الاحتياطية بنجاح');
            
        } catch (error) {
            console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
            app.showError('خطأ في إنشاء النسخة الاحتياطية');
        }
    }

    async createBackupData() {
        return {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            settings: this.currentSettings,
            trainees: await database.getAllTrainees(),
            attendance: await database.getAllAttendance(),
            subjects: await database.getAllSubjects(),
            grades: await database.getAllGrades()
        };
    }

    createManualBackup() {
        this.createBackup();
    }

    downloadAllData() {
        this.createBackup();
    }
}

// تصدير الكلاس
if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
    window.settingsManager = new SettingsManager();
}