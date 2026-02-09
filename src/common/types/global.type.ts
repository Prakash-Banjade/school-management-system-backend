
export type AuthUser =
    // when logged in as super admin, admin
    {
        accountId: string;
        email: string;
        role: Omit<Role, Role.STUDENT>;
        branchId: string | undefined;
        deviceId: string;
        asGuest?: boolean
    }
    // when logged in as student
    | {
        accountId: string;
        email: string;
        role: Role.STUDENT;
        classRoomId: string;
        parentClassId: string | null;
        studentId: string;
        branchId: string;
        deviceId: string;
        asGuest?: boolean
    }
    // when logged in as teacher
    | {
        accountId: string;
        email: string;
        role: Role.TEACHER;
        teacherId: string;
        branchId: string;
        deviceId: string;
        asGuest?: boolean
    }

export enum Action {
    MANAGE = 'manage',
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    RESTORE = 'restore',
}

export enum Role {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    USER = 'user',
    TEACHER = 'teacher',
    STUDENT = 'student',
    STAFF = 'staff',
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export enum EClassType {
    PRIMARY = 'primary', // to denote the direct parent class
    SECTION = 'section',
}

export enum ESubjectType {
    REGULAR = 'regular',
    OPTIONAL = 'optional',
}

export enum EReligion {
    ISLAM = 'islam',
    HINDUISM = 'hinduism',
    SIKHISM = 'sikhism',
    BUDDHISM = 'buddhism',
    CHRISTIANITY = 'christianity',
    PROTESTANTISM = 'protestantism',
    OTHER = 'other',
}

export enum EMaritalStatus {
    SINGLE = 'single',
    MARRIED = 'married',
    DIVORCED = 'divorced',
    WIDOWED = 'widowed',
}

export enum EBloodGroup {
    A_POSITIVE = 'A+',
    B_POSITIVE = 'B+',
    AB_POSITIVE = 'AB+',
    O_POSITIVE = 'O+',
    A_NEGATIVE = 'A-',
    B_NEGATIVE = 'B-',
    AB_NEGATIVE = 'AB-',
    O_NEGATIVE = 'O-',
}

export enum EGuardianRelation {
    FATHER = 'father',
    MOTHER = 'mother',
    SISTER = 'sister',
    BROTHER = 'brother',
    GUARDIAN = 'guardian',
    OTHER = 'other',
}

export enum EAttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late',
    LEAVE = 'leave',
}

export enum ESubjectChapterPriority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

export enum ETask {
    CLASSWORK = 'classwork',
    HOMEWORK = 'homework',
    ASSIGNMENT = 'assignment',
}

export enum EStaff {
    DRIVER = 'driver',
    LABOR = 'labor',
    HELPER = 'helper',
    PEON = 'peon',
    GUARD = 'guard',
    LIBRARIAN = 'librarian',
    RECEPTIONIST = 'receptionist',
    ACCOUNTANT = 'accountant',
}

export enum ESalaryStatus {
    PAID = 'paid',
    PENDING = 'pending',
}

export enum ELeaveRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export enum ELibarryBookStatus {
    RETURNED = 'returned',
    PENDING = 'pending',
}

export enum EPaymentMethod {
    CASH = 'cash',
    CHEQUE = 'cheque',
    BANK = 'bank',
}

export enum EDormitoryType {
    BOYS = 'boys',
    GIRLS = 'girls',
    BOTH = 'both',
}

export enum EDayOfWeek {
    SUNDAY = 'sunday',
    MONDAY = 'monday',
    TUESDAY = 'tuesday',
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
}

export enum ERoutineType {
    CLASS = 'class',
    BREAK = 'break',
}

export enum EBookTransactionStatus {
    Issued = 'issued',
    Returned = 'returned',
    Overdue = 'overdue',
}

export enum ETaskSubmissionStatus {
    Submitted = 'submitted',
    Late = 'late',
    Not_Submitted = 'not_submitted',
}

export enum EFileMimeType {
    IMAGE_JPG = 'image/jpeg',
    IMAGE_PNG = 'image/png',
    IMAGE_WEBP = 'image/webp',
    PDF = 'application/pdf',
    DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    Audio = 'audio/mpeg',
    MP4 = 'video/mp4',
}

export enum EVehicleType {
    Car = 'car',
    Bus = 'bus',
    Bike = 'bike',
    Motorcycle = 'motorcycle',
    Jeep = 'jeep',
    Truck = 'truck',
    Van = 'van',
    Winger = 'winger',
    Force = 'force',
}

export enum ELessonPlanStatus {
    Not_Started = 'not_started',
    In_Progress = 'in_progress',
    Completed = 'completed',
}