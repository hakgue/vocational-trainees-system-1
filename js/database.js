/**
 * منصة إدارة المتدربين - قاعدة البيانات المحلية
 * يستخدم IndexedDB للعمل دون إنترنت
 */

class TraineeDatabase {
    constructor() {
        this.dbName = 'TraineeManagementDB';
        this.dbVersion = 1;
        this.db = null;
        
        // الشعب المهنية الرسمية 23 شعبة
        this.professionalBranches = [
            { id: 'AGR', name: 'الفلاحة', nameAr: 'الفلاحة', nameFr: 'Agriculture' },
            { id: 'BTP', name: 'البناء والأشغال العمومية', nameAr: 'البناء والأشغال العمومية', nameFr: 'Bâtiment et Travaux Publics' },
            { id: 'CIP', name: 'البلاستيك والكيمياء الصناعية', nameAr: 'البلاستيك والكيمياء الصناعية', nameFr: 'Chimie Industrielle et Plastiques' },
            { id: 'CMS', name: 'الإنشاءات الميكانيكية وصناعة الحديد', nameAr: 'الإنشاءات الميكانيكية وصناعة الحديد', nameFr: 'Construction Mécanique et Sidérurgie' },
            { id: 'ELE', name: 'الكهرباء-الإلكترونيك-الطاقوية', nameAr: 'الكهرباء-الإلكترونيك-الطاقوية', nameFr: 'Électricité-Électronique-Énergétique' },
            { id: 'HRT', name: 'الفندقة والإطعام-السياحة', nameAr: 'الفندقة والإطعام-السياحة', nameFr: 'Hôtellerie-Restauration-Tourisme' },
            { id: 'IAA', name: 'الصناعة الغذائية الزراعية', nameAr: 'الصناعة الغذائية الزراعية', nameFr: 'Industries Agro-Alimentaires' },
            { id: 'INP', name: 'الصناعات النفطية', nameAr: 'الصناعات النفطية', nameFr: 'Industries Pétrolières' },
            { id: 'INT', name: 'الإعلام الآلي-الرقمنة-الاتصالات', nameAr: 'الإعلام الآلي-الرقمنة-الاتصالات', nameFr: 'Informatique-Numérique-Télécommunications' },
            { id: 'MEE', name: 'مهن البيئة والمياه', nameAr: 'مهن البيئة والمياه', nameFr: 'Métiers de l\'Environnement et de l\'Eau' },
            { id: 'MIC', name: 'المحاجر والمناجم', nameAr: 'المحاجر والمناجم', nameFr: 'Mines et Carrières' },
            { id: 'PEC', name: 'تربية المائيات والصيد البحري', nameAr: 'تربية المائيات والصيد البحري', nameFr: 'Pêche et Aquaculture' },
            { id: 'ART', name: 'الفنون-التراث والثقافة', nameAr: 'الفنون-التراث والثقافة', nameFr: 'Arts-Patrimoine et Culture' },
            { id: 'GRA', name: 'صناعة الطباعة والفنون', nameAr: 'صناعة الطباعة والفنون', nameFr: 'Industries Graphiques' },
            { id: 'ART_TRAD', name: 'الحرف التقليدية', nameAr: 'الحرف التقليدية', nameFr: 'Artisanat Traditionnel' },
            { id: 'WOOD', name: 'التأثيث والخشب', nameAr: 'التأثيث والخشب', nameFr: 'Ameublement et Bois' },
            { id: 'METAL', name: 'الإنشاءات المعدنية', nameAr: 'الإنشاءات المعدنية', nameFr: 'Constructions Métalliques' },
            { id: 'FROZEN', name: 'الصناعة المجمدة', nameAr: 'الصناعة المجمدة', nameFr: 'Industries du Froid' },
            { id: 'SERVICES', name: 'مهن الخدمات', nameAr: 'مهن الخدمات', nameFr: 'Métiers de Services' },
            { id: 'MECH', name: 'ميكانيك الآلات والمحركات', nameAr: 'ميكانيك الآلات والمحركات', nameFr: 'Mécanique des Machines et Moteurs' },
            { id: 'MGMT', name: 'تقنيات التسيير والإدارة', nameAr: 'تقنيات التسيير والإدارة', nameFr: 'Techniques de Gestion et d\'Administration' },
            { id: 'AV', name: 'التقنيات السمعية البصرية', nameAr: 'التقنيات السمعية البصرية', nameFr: 'Techniques Audiovisuelles' },
            { id: 'TEXTILE', name: 'الألبسة والنسيج', nameAr: 'الألبسة والنسيج', nameFr: 'Habillement et Textile' }
        ];
        
        // مستويات التكوين الرسمية
        this.trainingLevels = [
            {
                id: 1,
                code: 'STMM',
                nameAr: 'شهادة التكوين المهني المتخصص',
                nameFr: 'Certificat de Formation Professionnelle Spécialisée',
                duration: 12,
                entryLevel: 'مستوى السنة الثانية متوسط',
                description: 'يؤهل عامل متخصص'
            },
            {
                id: 2,
                code: 'CMP',
                nameAr: 'شهادة الكفاءة المهنية',
                nameFr: 'Certificat d\'Aptitude Professionnelle',
                duration: 12,
                entryLevel: 'مستوى السنة الرابعة متوسط',
                description: 'يؤهل عامل مؤهل ومساعد'
            },
            {
                id: 3,
                code: 'CMP2',
                nameAr: 'شهادة التحكم المهني',
                nameFr: 'Certificat de Maîtrise Professionnelle',
                duration: 18,
                entryLevel: 'مستوى السنة الأولى ثانوي',
                description: 'يؤهل عامل عالي التأهيل ومساعد'
            },
            {
                id: 4,
                code: 'BT',
                nameAr: 'شهادة تقني',
                nameFr: 'Brevet de Technicien',
                duration: 24,
                entryLevel: 'مستوى السنة الأولى ثانوي',
                description: 'يؤهل تقني'
            },
            {
                id: 5,
                code: 'BTS',
                nameAr: 'شهادة تقني سامي',
                nameFr: 'Brevet de Technicien Supérieur',
                duration: 30,
                entryLevel: 'مستوى السنة الثالثة ثانوي',
                description: 'يؤهل تقني سامي'
            }
        ];
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            await this.initializeDefaultData();
            console.log('تم تهيئة قاعدة البيانات بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ في تهيئة قاعدة البيانات:', error);
            return false;
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // جدول المتدربين
                if (!db.objectStoreNames.contains('trainees')) {
                    const traineeStore = db.createObjectStore('trainees', { keyPath: 'id', autoIncrement: true });
                    traineeStore.createIndex('registrationNumber', 'registrationNumber', { unique: true });
                    traineeStore.createIndex('specialty', 'specialty', { unique: false });
                    traineeStore.createIndex('level', 'level', { unique: false });
                    traineeStore.createIndex('group', 'group', { unique: false });
                    traineeStore.createIndex('status', 'status', { unique: false });
                    traineeStore.createIndex('fullName', 'fullName', { unique: false });
                }

                // جدول الحضور
                if (!db.objectStoreNames.contains('attendance')) {
                    const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    attendanceStore.createIndex('traineeId', 'traineeId', { unique: false });
                    attendanceStore.createIndex('date', 'date', { unique: false });
                    attendanceStore.createIndex('session', 'session', { unique: false }); // session1, session2, session3, session4
                    attendanceStore.createIndex('period', 'period', { unique: false }); // period1, period2
                    attendanceStore.createIndex('dateSession', ['date', 'session'], { unique: false });
                }

                // جدول المواد
                if (!db.objectStoreNames.contains('subjects')) {
                    const subjectStore = db.createObjectStore('subjects', { keyPath: 'id', autoIncrement: true });
                    subjectStore.createIndex('specialty', 'specialty', { unique: false });
                    subjectStore.createIndex('level', 'level', { unique: false });
                }

                // جدول الدرجات
                if (!db.objectStoreNames.contains('grades')) {
                    const gradeStore = db.createObjectStore('grades', { keyPath: 'id', autoIncrement: true });
                    gradeStore.createIndex('traineeId', 'traineeId', { unique: false });
                    gradeStore.createIndex('subjectId', 'subjectId', { unique: false });
                    gradeStore.createIndex('evaluationType', 'evaluationType', { unique: false });
                }

                // جدول الإعدادات
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
                }

                // جدول الشعب والتخصصات
                if (!db.objectStoreNames.contains('specialties')) {
                    const specialtyStore = db.createObjectStore('specialties', { keyPath: 'id', autoIncrement: true });
                    specialtyStore.createIndex('branchId', 'branchId', { unique: false });
                    specialtyStore.createIndex('level', 'level', { unique: false });
                }
            };
        });
    }

    async initializeDefaultData() {
        // تهيئة الإعدادات الافتراضية
        const defaultSettings = {
            institutionName: 'مركز التكوين المهني',
            institutionAddress: 'الجزائر',
            academicYear: '2024-2025',
            
            // نظام الفترات والحصص - كل فترة تحتوي على حصتين
            periodsPerDay: 2,
            sessionsPerDay: 4,
            
            // الفترة الأولى - حصتين
            period1Name: 'الفترة الصباحية',
            session1Name: 'الحصة الأولى',
            session1StartTime: '08:00',
            session1EndTime: '10:00',
            session2Name: 'الحصة الثانية',
            session2StartTime: '10:15',
            session2EndTime: '12:15',
            
            // الفترة الثانية - حصتين
            period2Name: 'الفترة المسائية',
            session3Name: 'الحصة الثالثة',
            session3StartTime: '13:00',
            session3EndTime: '15:00',
            session4Name: 'الحصة الرابعة',
            session4StartTime: '15:15',
            session4EndTime: '17:15',
            
            // فترة استراحة بين الفترتين
            breakTime: '12:15-13:00',
            
            // إعدادات التقييم
            gradeScale: 20,
            passingGrade: 10,
            
            // إعدادات النظام
            systemLanguage: 'ar',
            dateFormat: 'dd/MM/yyyy',
            timeFormat: '24h'
        };

        for (const [key, value] of Object.entries(defaultSettings)) {
            await this.saveSetting(key, value);
        }
    }

    // ==========================================
    // عمليات المتدربين
    // ==========================================

    async addTrainee(traineeData) {
        const transaction = this.db.transaction(['trainees'], 'readwrite');
        const store = transaction.objectStore('trainees');
        
        const trainee = {
            ...traineeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(trainee);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getTrainee(id) {
        const transaction = this.db.transaction(['trainees'], 'readonly');
        const store = transaction.objectStore('trainees');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateTrainee(id, updates) {
        const trainee = await this.getTrainee(id);
        if (!trainee) throw new Error('المتدرب غير موجود');

        const updatedTrainee = {
            ...trainee,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const transaction = this.db.transaction(['trainees'], 'readwrite');
        const store = transaction.objectStore('trainees');
        
        return new Promise((resolve, reject) => {
            const request = store.put(updatedTrainee);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTrainee(id) {
        const transaction = this.db.transaction(['trainees'], 'readwrite');
        const store = transaction.objectStore('trainees');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllTrainees() {
        const transaction = this.db.transaction(['trainees'], 'readonly');
        const store = transaction.objectStore('trainees');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getTraineesBySpecialty(specialty) {
        const transaction = this.db.transaction(['trainees'], 'readonly');
        const store = transaction.objectStore('trainees');
        const index = store.index('specialty');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(specialty);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ==========================================
    // عمليات الحضور
    // ==========================================

    async recordAttendance(attendanceData) {
        const transaction = this.db.transaction(['attendance'], 'readwrite');
        const store = transaction.objectStore('attendance');
        
        const attendance = {
            ...attendanceData,
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(attendance);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateAttendance(id, updates) {
        const transaction = this.db.transaction(['attendance'], 'readwrite');
        const store = transaction.objectStore('attendance');
        
        const attendance = await this.getAttendanceRecord(id);
        const updatedAttendance = { ...attendance, ...updates };
        
        return new Promise((resolve, reject) => {
            const request = store.put(updatedAttendance);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceRecord(id) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByTrainee(traineeId, startDate = null, endDate = null) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        const index = store.index('traineeId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(traineeId);
            request.onsuccess = () => {
                let results = request.result;
                
                if (startDate || endDate) {
                    results = results.filter(record => {
                        const recordDate = new Date(record.date);
                        if (startDate && recordDate < new Date(startDate)) return false;
                        if (endDate && recordDate > new Date(endDate)) return false;
                        return true;
                    });
                }
                
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ==========================================
    // عمليات الحضور المتقدمة
    // ==========================================

    async addAttendance(attendanceData) {
        const transaction = this.db.transaction(['attendance'], 'readwrite');
        const store = transaction.objectStore('attendance');
        
        const attendance = {
            ...attendanceData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(attendance);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateAttendance(id, updates) {
        const attendance = await this.getAttendance(id);
        if (!attendance) throw new Error('سجل الحضور غير موجود');

        const updatedAttendance = {
            ...attendance,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const transaction = this.db.transaction(['attendance'], 'readwrite');
        const store = transaction.objectStore('attendance');
        
        return new Promise((resolve, reject) => {
            const request = store.put(updatedAttendance);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendance(id) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteAttendance(id) {
        const transaction = this.db.transaction(['attendance'], 'readwrite');
        const store = transaction.objectStore('attendance');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByDate(date) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        const index = store.index('date');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(date);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByTrainee(traineeId) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        const index = store.index('traineeId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(traineeId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceBySession(session) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        const index = store.index('session');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(session);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByDateRange(startDate, endDate) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        const index = store.index('date');
        
        return new Promise((resolve, reject) => {
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByTraineeAndDateRange(traineeId, startDate, endDate) {
        const allRecords = await this.getAttendanceByTrainee(traineeId);
        return allRecords.filter(record => 
            record.date >= startDate && record.date <= endDate
        );
    }

    async getAttendanceStatistics(startDate, endDate, traineeId = null) {
        let attendanceRecords;
        
        if (traineeId) {
            const allRecords = await this.getAttendanceByTrainee(traineeId);
            attendanceRecords = allRecords.filter(record => 
                record.date >= startDate && record.date <= endDate
            );
        } else {
            attendanceRecords = await this.getAttendanceByDateRange(startDate, endDate);
        }
        
        const stats = {
            totalRecords: attendanceRecords.length,
            present: attendanceRecords.filter(r => r.status === 'present').length,
            late: attendanceRecords.filter(r => r.status === 'late').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            attendanceRate: 0,
            dailyStats: {},
            sessionStats: {}
        };
        
        // حساب معدل الحضور
        if (stats.totalRecords > 0) {
            const attendanceValue = stats.present + (stats.late * 0.5);
            stats.attendanceRate = (attendanceValue / stats.totalRecords) * 100;
        }
        
        // إحصائيات يومية
        attendanceRecords.forEach(record => {
            if (!stats.dailyStats[record.date]) {
                stats.dailyStats[record.date] = { present: 0, late: 0, absent: 0 };
            }
            stats.dailyStats[record.date][record.status]++;
        });
        
        // إحصائيات الحصص
        attendanceRecords.forEach(record => {
            if (!stats.sessionStats[record.session]) {
                stats.sessionStats[record.session] = { present: 0, late: 0, absent: 0 };
            }
            stats.sessionStats[record.session][record.status]++;
        });
        
        return stats;
    }

    async bulkUpdateAttendance(updates) {
        const transaction = this.db.transaction(['attendance'], 'readwrite');
        const store = transaction.objectStore('attendance');
        
        return new Promise((resolve, reject) => {
            let completed = 0;
            const total = updates.length;
            
            if (total === 0) {
                resolve([]);
                return;
            }
            
            const results = [];
            
            updates.forEach((update, index) => {
                const request = store.put({
                    ...update,
                    updatedAt: new Date().toISOString()
                });
                
                request.onsuccess = () => {
                    results[index] = request.result;
                    completed++;
                    if (completed === total) {
                        resolve(results);
                    }
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        });
    }

    // عمليات الحضور المجمعة
    async markBulkAttendance(traineeIds, date, session, status) {
        const updates = [];
        
        for (const traineeId of traineeIds) {
            // البحث عن سجل موجود
            const existingRecords = await this.getAttendanceByDate(date);
            const existingRecord = existingRecords.find(r => 
                r.traineeId === traineeId && r.session === session
            );
            
            if (existingRecord) {
                updates.push({
                    ...existingRecord,
                    status: status,
                    updatedAt: new Date().toISOString()
                });
            } else {
                updates.push({
                    traineeId: traineeId,
                    date: date,
                    session: session,
                    period: this.getSessionsMapping()[session].period,
                    status: status,
                    timestamp: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        }
        
        return await this.bulkUpdateAttendance(updates);
    }

    // ==========================================
    // عمليات المواد
    // ==========================================

    async addSubject(subjectData) {
        const transaction = this.db.transaction(['subjects'], 'readwrite');
        const store = transaction.objectStore('subjects');
        
        const subject = {
            ...subjectData,
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(subject);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSubjectsBySpecialty(specialty, level = null) {
        const transaction = this.db.transaction(['subjects'], 'readonly');
        const store = transaction.objectStore('subjects');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                let results = request.result.filter(subject => subject.specialty === specialty);
                if (level) {
                    results = results.filter(subject => subject.level === level);
                }
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ==========================================
    // عمليات الدرجات
    // ==========================================

    async addGrade(gradeData) {
        const transaction = this.db.transaction(['grades'], 'readwrite');
        const store = transaction.objectStore('grades');
        
        const grade = {
            ...gradeData,
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(grade);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getGradesByTrainee(traineeId) {
        const transaction = this.db.transaction(['grades'], 'readonly');
        const store = transaction.objectStore('grades');
        const index = store.index('traineeId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(traineeId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ==========================================
    // عمليات الإعدادات
    // ==========================================

    async saveSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        const setting = { key, value };

        return new Promise((resolve, reject) => {
            const request = store.put(setting);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllSettings() {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ==========================================
    // عمليات إحصائية
    // ==========================================

    async getAttendanceStatistics(startDate = null, endDate = null, specialty = null) {
        const allAttendance = await this.getAllAttendance();
        let filteredAttendance = allAttendance;

        // تطبيق الفلاتر
        if (startDate || endDate || specialty) {
            const trainees = await this.getAllTrainees();
            const traineeMap = new Map(trainees.map(t => [t.id, t]));

            filteredAttendance = allAttendance.filter(record => {
                const recordDate = new Date(record.date);
                const trainee = traineeMap.get(record.traineeId);

                if (startDate && recordDate < new Date(startDate)) return false;
                if (endDate && recordDate > new Date(endDate)) return false;
                if (specialty && trainee && trainee.specialty !== specialty) return false;
                
                return true;
            });
        }

        // حساب الإحصائيات
        const stats = {
            total: filteredAttendance.length,
            present: filteredAttendance.filter(r => r.status === 'present').length,
            absent: filteredAttendance.filter(r => r.status === 'absent').length,
            late: filteredAttendance.filter(r => r.status === 'late').length
        };

        stats.presentPercentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0;
        stats.absentPercentage = stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(2) : 0;
        stats.latePercentage = stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(2) : 0;

        return stats;
    }

    async getAllAttendance() {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ==========================================
    // عمليات النسخ الاحتياطي
    // ==========================================

    async exportData() {
        const data = {
            trainees: await this.getAllTrainees(),
            attendance: await this.getAllAttendance(),
            subjects: await this.getAllSubjects(),
            grades: await this.getAllGrades(),
            settings: await this.getAllSettings(),
            exportDate: new Date().toISOString(),
            version: this.dbVersion
        };

        return JSON.stringify(data, null, 2);
    }

    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // حذف البيانات الحالية
            await this.clearAllData();
            
            // استيراد البيانات الجديدة
            if (data.trainees) {
                for (const trainee of data.trainees) {
                    delete trainee.id; // للسماح بإعادة الترقيم
                    await this.addTrainee(trainee);
                }
            }
            
            // باقي البيانات...
            
            return true;
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            return false;
        }
    }

    async clearAllData() {
        const stores = ['trainees', 'attendance', 'subjects', 'grades'];
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    // ==========================================
    // عمليات الجدول الزمني والحصص
    // ==========================================

    async getScheduleConfig() {
        const settings = {
            periodsPerDay: await this.getSetting('periodsPerDay'),
            sessionsPerDay: await this.getSetting('sessionsPerDay'),
            
            period1Name: await this.getSetting('period1Name'),
            session1Name: await this.getSetting('session1Name'),
            session1StartTime: await this.getSetting('session1StartTime'),
            session1EndTime: await this.getSetting('session1EndTime'),
            session2Name: await this.getSetting('session2Name'),
            session2StartTime: await this.getSetting('session2StartTime'),
            session2EndTime: await this.getSetting('session2EndTime'),
            
            period2Name: await this.getSetting('period2Name'),
            session3Name: await this.getSetting('session3Name'),
            session3StartTime: await this.getSetting('session3StartTime'),
            session3EndTime: await this.getSetting('session3EndTime'),
            session4Name: await this.getSetting('session4Name'),
            session4StartTime: await this.getSetting('session4StartTime'),
            session4EndTime: await this.getSetting('session4EndTime'),
            
            breakTime: await this.getSetting('breakTime')
        };
        
        return settings;
    }

    async updateScheduleConfig(config) {
        for (const [key, value] of Object.entries(config)) {
            await this.saveSetting(key, value);
        }
    }

    getSessionsMapping() {
        return {
            session1: { period: 'period1', order: 1, name: 'الحصة الأولى' },
            session2: { period: 'period1', order: 2, name: 'الحصة الثانية' },
            session3: { period: 'period2', order: 3, name: 'الحصة الثالثة' },
            session4: { period: 'period2', order: 4, name: 'الحصة الرابعة' }
        };
    }

    getSessionsByPeriod(period) {
        const mapping = this.getSessionsMapping();
        return Object.keys(mapping).filter(session => mapping[session].period === period);
    }

    // ==========================================
    // عمليات مساعدة
    // ==========================================

    getProfessionalBranches() {
        return this.professionalBranches;
    }

    getTrainingLevels() {
        return this.trainingLevels;
    }

    getBranchById(id) {
        return this.professionalBranches.find(branch => branch.id === id);
    }

    getLevelById(id) {
        return this.trainingLevels.find(level => level.id === id);
    }

    async getAllSubjects() {
        const transaction = this.db.transaction(['subjects'], 'readonly');
        const store = transaction.objectStore('subjects');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllGrades() {
        const transaction = this.db.transaction(['grades'], 'readonly');
        const store = transaction.objectStore('grades');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// إنشاء مرئي وحيد لقاعدة البيانات
const database = new TraineeDatabase();

// تصدير للاستخدام في ملفات أخرى
if (typeof window !== 'undefined') {
    window.database = database;
}