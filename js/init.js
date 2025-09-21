/**
 * منصة إدارة المتدربين - ملف التهيئة الرئيسي
 * تشغيل وربط جميع مكونات النظام
 */

// متغيرات عامة للتطبيق
window.appConfig = {
    version: '1.0.0',
    name: 'منصة إدارة المتدربين',
    isOnline: navigator.onLine,
    currentUser: null,
    initialized: false
};

// دالة التهيئة الرئيسية
async function initializeApplication() {
    try {
        console.log('🚀 بدء تهيئة منصة إدارة المتدربين...');
        
        // إظهار شاشة التحميل
        showInitialLoadingScreen();
        
        // تهيئة قاعدة البيانات
        console.log('📊 تهيئة قاعدة البيانات...');
        const dbInitialized = await database.init();
        if (!dbInitialized) {
            throw new Error('فشل في تهيئة قاعدة البيانات');
        }
        
        // تهيئة التطبيق الرئيسي
        console.log('🔧 تهيئة التطبيق الرئيسي...');
        await app.init();
        
        // تهيئة مدير التنقل
        console.log('🧭 تهيئة نظام التنقل...');
        await navigationManager.init();
        
        // تحديد حالة الاتصال
        updateOnlineStatus();
        
        // إضافة مستمعي الأحداث العامة
        setupGlobalEventListeners();
        
        // تسجيل Service Worker
        await registerServiceWorker();
        
        // إخفاء شاشة التحميل
        hideInitialLoadingScreen();
        
        // تسجيل نجاح التهيئة
        window.appConfig.initialized = true;
        console.log('✅ تم تهيئة التطبيق بنجاح!');
        
        // عرض رسالة ترحيب
        setTimeout(() => {
            app.showNotification('مرحباً بك في منصة إدارة المتدربين', 'success', 3000);
        }, 1000);
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
        showInitializationError(error);
    }
}

function showInitialLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.querySelector('p').textContent = 'جاري تهيئة التطبيق...';
    }
}

function hideInitialLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function showInitializationError(error) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div class="spinner-container">
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h4>خطأ في تهيئة التطبيق</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> إعادة المحاولة
                    </button>
                </div>
            </div>
        `;
    }
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('✅ تم تسجيل Service Worker بنجاح:', registration.scope);
            
            // التحقق من وجود تحديثات
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        app.showNotification('يتوفر تحديث جديد للتطبيق. سيتم التطبيق عند إعادة التحميل.', 'info', 8000);
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ فشل في تسجيل Service Worker:', error);
        }
    }
}

function setupGlobalEventListeners() {
    // مراقبة حالة الاتصال
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // منع النقر بالزر الأيمن (اختياري)
    // document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // منع اختصارات التطوير (اختياري في الإنتاج)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U')) {
            // e.preventDefault(); // يمكن تفعيله في الإنتاج
        }
    });
    
    // مراقبة تغيير حجم النافذة
    window.addEventListener('resize', handleWindowResize);
    
    // مراقبة خروج المستخدم من الصفحة
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // مراقبة تغيير التبويب
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function updateOnlineStatus() {
    window.appConfig.isOnline = navigator.onLine;
    const statusElement = document.querySelector('.connection-status');
    
    if (navigator.onLine) {
        console.log('🌐 متصل بالإنترنت');
        if (statusElement) {
            statusElement.className = 'connection-status online';
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> متصل';
        }
        
        // محاولة مزامنة البيانات المعلقة
        if (app && app.syncPendingData) {
            app.syncPendingData();
        }
    } else {
        console.log('📱 وضع عدم الاتصال');
        if (statusElement) {
            statusElement.className = 'connection-status offline';
            statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> غير متصل';
        }
    }
}

function handleWindowResize() {
    // تحديث التخطيط عند تغيير حجم النافذة
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile-view', isMobile);
    
    // إعادة حساب الرسوم البيانية إذا كانت موجودة
    if (window.dashboardManager && window.dashboardManager.charts) {
        Object.values(window.dashboardManager.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }
}

function handleBeforeUnload(e) {
    // حفظ البيانات قبل مغادرة الصفحة
    if (app && app.saveAllPendingData) {
        app.saveAllPendingData();
    }
    
    // إظهار تحذير إذا كانت هناك تغييرات غير محفوظة
    const hasUnsavedChanges = checkForUnsavedChanges();
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'لديك تغييرات غير محفوظة. هل تريد المغادرة؟';
        return e.returnValue;
    }
}

function checkForUnsavedChanges() {
    // التحقق من وجود تغييرات غير محفوظة
    const changedForms = document.querySelectorAll('form.changed');
    const unsavedButtons = document.querySelectorAll('.btn-warning[onclick*="save"]');
    
    return changedForms.length > 0 || unsavedButtons.length > 0;
}

function handleVisibilityChange() {
    if (document.hidden) {
        // المستخدم غادر التبويب
        console.log('👁️ المستخدم غادر التبويب');
        
        // إيقاف العمليات غير الضرورية
        if (window.dashboardManager && window.dashboardManager.stopAutoRefresh) {
            window.dashboardManager.stopAutoRefresh();
        }
    } else {
        // المستخدم عاد للتبويب
        console.log('👁️ المستخدم عاد للتبويب');
        
        // استئناف العمليات
        if (window.dashboardManager && window.dashboardManager.startAutoRefresh) {
            window.dashboardManager.startAutoRefresh();
        }
        
        // تحديث البيانات
        if (navigationManager && navigationManager.refreshCurrentSection) {
            navigationManager.refreshCurrentSection();
        }
    }
}

// دوال مساعدة عامة
window.appUtils = {
    // تنسيق التواريخ
    formatDate: (date, locale = 'ar-DZ') => {
        return new Date(date).toLocaleDateString(locale);
    },
    
    // تنسيق الأوقات
    formatTime: (time, locale = 'ar-DZ') => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // تنسيق الأرقام
    formatNumber: (number, locale = 'ar-DZ') => {
        return new Intl.NumberFormat(locale).format(number);
    },
    
    // تحويل الأرقام العربية إلى إنجليزية
    arabicToEnglishNumbers: (str) => {
        const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
        const englishNumbers = '0123456789';
        return str.replace(/[٠-٩]/g, (char) => {
            return englishNumbers[arabicNumbers.indexOf(char)];
        });
    },
    
    // تحويل الأرقام الإنجليزية إلى عربية
    englishToArabicNumbers: (str) => {
        const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
        const englishNumbers = '0123456789';
        return str.replace(/[0-9]/g, (char) => {
            return arabicNumbers[englishNumbers.indexOf(char)];
        });
    },
    
    // التحقق من صحة البريد الإلكتروني
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // التحقق من صحة رقم الهاتف الجزائري
    validateAlgerianPhone: (phone) => {
        const phoneRegex = /^(\+213|0)(5|6|7)[0-9]{8}$/;
        return phoneRegex.test(phone);
    },
    
    // إنشاء معرف فريد
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // تنظيف النصوص
    sanitizeText: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // تحميل صورة وتحويلها إلى base64
    imageToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};

// دوال للاستعلامات السريعة
window.quickQueries = {
    // جلب المتدربين النشطين
    getActiveTrainees: async () => {
        const trainees = await database.getAllTrainees();
        return trainees.filter(t => t.status === 'active');
    },
    
    // جلب حضور اليوم
    getTodayAttendance: async () => {
        const today = new Date().toISOString().split('T')[0];
        return await database.getAttendanceByDate(today);
    },
    
    // حساب معدل الحضور
    calculateAttendanceRate: async (traineeId, startDate, endDate) => {
        const attendance = await database.getAttendanceByTrainee(traineeId, startDate, endDate);
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        return totalDays > 0 ? (presentDays / totalDays * 100).toFixed(1) : 0;
    }
};

// إضافة شريط حالة الاتصال إذا لم يكن موجوداً
function addConnectionStatusBar() {
    if (!document.querySelector('.connection-status')) {
        const statusBar = document.createElement('div');
        statusBar.className = 'connection-status';
        statusBar.style.cssText = `
            position: fixed;
            top: 70px;
            left: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 1050;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(statusBar);
    }
}

// تهيئة التطبيق عند تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 تم تحميل DOM، بدء التهيئة...');
    
    // إضافة شريط حالة الاتصال
    addConnectionStatusBar();
    
    // بدء تهيئة التطبيق
    initializeApplication();
});

// تصدير دوال للاستخدام العام
window.initializeApplication = initializeApplication;
window.updateOnlineStatus = updateOnlineStatus;