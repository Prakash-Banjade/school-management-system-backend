export const singleStudentColumnsConfig = {
    id: true,
    createdAt: true,
    firstName: true,
    lastName: true,
    email: true,
    dob: true,
    phone: true,
    gender: true,
    studentId: true,
    rollNo: true,
    bankName: true,
    bankAccountName: true,
    bankAccountNumber: true,
    previousSchoolDetails: true,
    previousSchoolName: true,
    birthCertificateNumber: true,
    nationalIdCardNo: true,
    isPhysicallyChallenged: true,
    bloodGroup: true,
    caste: true,
    religion: true,
    currentAddress: true,
    permanentAddress: true,
    enrollments: {
        id: true,
        rollNo: true,
        classRoom: {
            id: true,
            name: true,
            parent: {
                id: true,
                name: true,
            }
        }
    },
    documentAttachments: {
        id: true,
        url: true,
        originalName: true,
    },
    guardians: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        occupation: true,
        guardianProfileImage: { // this is done because there will be a conflict with the profileImage field between Guardian and Account
            id: true,
            url: true
        },
        relation: true,
        receiveNotification: true,
    },
    dormitoryRoom: {
        id: true,
        roomNumber: true,
    },
    routeStop: {
        id: true,
        name: true,
        vehicle: {
            id: true,
            vehicleNumber: true
        }
    },
    account: {
        id: true,
        profileImage: {
            id: true,
            url: true
        },
    }
}