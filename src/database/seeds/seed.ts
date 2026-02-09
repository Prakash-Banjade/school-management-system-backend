
import { DataSource } from 'typeorm';
import { User } from '../../auth-system/users/entities/user.entity';
import { Account } from '../../auth-system/accounts/entities/account.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Faculty } from '../../faculties/entities/faculty.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';
import { ChargeHead, EChargeHeadPeriod } from '../../finance-system/fee-management/charge-heads/entities/charge-head.entity';
import { EBloodGroup, EClassType, EMaritalStatus, EReligion, Gender, Role } from '../../common/types/global.type';
import { CHARGE_HEADS, PASSWORD_SALT_COUNT, SCHOOL_LEVEL_FACULTY_NAME } from '../../common/CONSTANTS';
import { ClassRoom } from '../../class-rooms/entities/class-room.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Student } from '../../students/entities/student.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { StudentLedger } from '../../finance-system/fee-management/student-ledgers/entities/student-ledger.entity';
import { getRegistrationNumber } from '../../utils/get-registration-number';
import * as bcrypt from 'bcryptjs';
import { endOfYear, startOfYear } from 'date-fns';
import { startOfDayString } from '../../utils/utils';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Seeding script for School Management System
 * Usage: pnpm db:seed
 */
async function seed() {
    console.log('🌱 Starting database seeding...');

    // Safety check: Prevent running in production unless explicitly intended (though script logic handles this check too)
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Skipping seed in production environment.');
        return;
    }

    const dataSource = new DataSource({
        type: 'mysql',
        url: process.env.DATABASE_URL,
        entities: [`${__dirname}/../../**/**.entity{.ts,.js}`],
        synchronize: false, // Do not sync, just seed. Schema should exist.
        timezone: 'Z',
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected');

        const userRepo = dataSource.getRepository(User);
        const accountRepo = dataSource.getRepository(Account);
        const branchRepo = dataSource.getRepository(Branch);
        const facultyRepo = dataSource.getRepository(Faculty);
        const academicYearRepo = dataSource.getRepository(AcademicYear);
        const chargeHeadRepo = dataSource.getRepository(ChargeHead);

        // 1. Create Default Branch
        const existingBranch = await branchRepo.findOneBy({ name: 'Default' });
        const defaultBranch = existingBranch || await branchRepo.save({
            name: 'Default',
            address: 'Default',
            description: 'This branch is created by default',
        });
        console.log(`✅ Default Branch ${defaultBranch.name} created`);

        // 2. Create Default Faculty
        const existingFaculty = await facultyRepo.findOneBy({ name: SCHOOL_LEVEL_FACULTY_NAME });
        const schoolLevelFaculty = existingFaculty || await facultyRepo.save({
            name: SCHOOL_LEVEL_FACULTY_NAME,
        });
        console.log(`✅ Default Faculty ${schoolLevelFaculty.name} created`);

        // 3. Create Super Admin
        const existingAdmin = await accountRepo.findOneBy({ email: "sms@gmail.com" });
        if (!existingAdmin) {
            const account = accountRepo.create({
                email: "sms@gmail.com",
                password: "SMS@11211",
                firstName: "SMS",
                lastName: "Admin",
                role: Role.SUPER_ADMIN,
                prevPasswords: [bcrypt.hashSync("SMS@11211", PASSWORD_SALT_COUNT)],
                user: userRepo.create({}),
                verifiedAt: new Date(),
            });
            account.setLowerCasedFullName();
            await accountRepo.save(account);
            console.log('✅ Super Admin created');
        } else {
            console.log('ℹ️  Super Admin already exists');
        }

        // 4. Create Default Academic Year
        const currentYearName = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const existingYear = await academicYearRepo.findOneBy({ name: currentYearName });
        const academicYear = existingYear || await academicYearRepo.save({
            startDate: startOfDayString(startOfYear(new Date())),
            endDate: startOfDayString(endOfYear(new Date())),
            name: currentYearName,
            isActive: true,
        });
        console.log(`✅ Academic Year ${academicYear.name} created`);

        // 5. Create Mandatory Charge Heads
        const mandatoryHeads: Partial<ChargeHead>[] = [
            {
                name: CHARGE_HEADS.admissionFee,
                description: 'Admission fee for the class room',
                isMandatory: true,
                period: EChargeHeadPeriod.One_Time,
                order: 1,
            },
            {
                name: CHARGE_HEADS.monthlyFee,
                description: 'Monthly fee for the class room',
                isMandatory: true,
                period: EChargeHeadPeriod.Monthly,
                order: 2,
            },
            {
                name: CHARGE_HEADS.transportationFee,
                description: 'Transportation fee of the student',
                isMandatory: true,
                period: EChargeHeadPeriod.Monthly,
                order: 3,
            },
            {
                name: CHARGE_HEADS.libraryFine,
                description: 'Library fine of the student',
                isMandatory: true,
                period: EChargeHeadPeriod.None,
                order: 4,
            }
        ];

        // Using upsert (insert or ignore) as per original logic
        await chargeHeadRepo
            .createQueryBuilder()
            .insert()
            .values(mandatoryHeads)
            .orIgnore()
            .execute();
        console.log('✅ Charge Heads seeded');

        // ==========================================
        // GUEST DATA SEEDING
        // ==========================================

        // 8. Create Guest ClassRoom
        const classRoomRepo = dataSource.getRepository(ClassRoom);
        const existingGuestClassRoom = await classRoomRepo.findOneBy({ name: 'Guest Class', branch: { id: defaultBranch.id } });
        const guestClassRoom = existingGuestClassRoom || await classRoomRepo.save({
            name: 'Guest Class',
            fullName: 'Guest Class', // Explicitly set as hook might fail if parent is undefined
            classType: EClassType.PRIMARY, // or appropriate type
            faculty: schoolLevelFaculty,
            branch: defaultBranch,
            location: 'Virtual',
            description: 'Classroom for guest students',
        });
        console.log(`✅ Guest ClassRoom ${guestClassRoom.name} created`);

        // 9. Create Guest Admin
        const existingGuestAdmin = await accountRepo.findOneBy({ email: `guest_${Role.ADMIN}@gmail.com` });
        if (!existingGuestAdmin) {
            const account = accountRepo.create({
                email: `guest_${Role.ADMIN}@gmail.com`,
                password: "SMS@guest1",
                firstName: "Guest",
                lastName: "Admin",
                role: Role.ADMIN,
                prevPasswords: [bcrypt.hashSync("SMS@guest1", PASSWORD_SALT_COUNT)],
                user: userRepo.create({}),
                verifiedAt: new Date(),
                branch: defaultBranch,
            });
            account.setLowerCasedFullName();
            await accountRepo.save(account);
            console.log('✅ Guest Admin created');
        } else {
            console.log('ℹ️  Guest Admin already exists');
        }

        // 10. Create Guest Teacher
        const existingGuestTeacher = await accountRepo.findOneBy({ email: `guest_${Role.TEACHER}@gmail.com` });
        if (!existingGuestTeacher) {
            const teacherRepo = dataSource.getRepository(Teacher);

            const teacher = teacherRepo.create({
                teacherId: `TCR-${new Date().getFullYear()}-00001`,
                firstName: 'Guest',
                lastName: 'Teacher',
                email: `guest_${Role.TEACHER}@gmail.com`,
                phone: '9800000001',
                gender: Gender.MALE, // arbitrary
                dob: new Date('1990-01-01').toISOString(),
                joinedDate: new Date().toISOString(),
                qualification: 'Guest Qualification',
                maritalStatus: EMaritalStatus.SINGLE,
                bloodGroup: EBloodGroup.A_POSITIVE,
                bankName: 'N/A',
                accountName: 'N/A',
                accountNumber: 'N/A',
                faculties: [schoolLevelFaculty],
            });

            const account = accountRepo.create({
                email: `guest_${Role.TEACHER}@gmail.com`,
                password: "SMS@guest1",
                firstName: "Guest",
                lastName: "Teacher",
                role: Role.TEACHER,
                prevPasswords: [bcrypt.hashSync("SMS@guest1", PASSWORD_SALT_COUNT)],
                teacher: teacher,
                verifiedAt: new Date(),
                branch: defaultBranch,
            });
            account.setLowerCasedFullName();

            // Check if teacher needs saving first or cascade handles it. 
            // Account entity has: @OneToOne(() => Teacher, teacher => teacher.account, { cascade: true, nullable: true })
            // So saving account should save teacher.
            await accountRepo.save(account);
            console.log('✅ Guest Teacher created');
        } else {
            console.log('ℹ️  Guest Teacher already exists');
        }

        // 11. Create Guest Student
        const existingGuestStudent = await accountRepo.findOneBy({ email: `guest_${Role.STUDENT}@gmail.com` });
        if (!existingGuestStudent) {
            const studentRepo = dataSource.getRepository(Student);

            const studentLedgerRepo = dataSource.getRepository(StudentLedger);
            const enrollmentRepo = dataSource.getRepository(Enrollment);

            const enrollment = enrollmentRepo.create({
                classRoom: guestClassRoom,
                academicYear: academicYear,
                rollNo: 1,
                enrollmentDate: new Date('2025-01-01').toISOString(), // Fixed date for consistency or current date
                registrationNumber: getRegistrationNumber(academicYear),
                ledger: studentLedgerRepo.create(),
            });

            const student = studentRepo.create({
                studentId: `STU-${new Date().getFullYear()}-00001`,
                firstName: 'Guest',
                lastName: 'Student',
                email: `guest_${Role.STUDENT}@gmail.com`,
                phone: '9800000002',
                gender: Gender.FEMALE, // arbitrary
                dob: new Date('2005-01-01').toISOString(),
                religion: EReligion.HINDUISM, // arbitrary or Other
                currentAddress: 'Guest Address',
                permanentAddress: 'Guest Address',
                classRoom: guestClassRoom,
                rollNo: 1,
                academicYearIds: [academicYear.id],
                enrollments: [enrollment],
            });

            const account = accountRepo.create({
                email: `guest_${Role.STUDENT}@gmail.com`,
                password: "SMS@guest1",
                firstName: "Guest",
                lastName: "Student",
                role: Role.STUDENT,
                prevPasswords: [bcrypt.hashSync("SMS@guest1", PASSWORD_SALT_COUNT)],
                student: student,
                verifiedAt: new Date(),
                branch: defaultBranch,
            });
            account.setLowerCasedFullName();

            // Account cascade saves student
            await accountRepo.save(account);
            console.log('✅ Guest Student created');
        } else {
            console.log('ℹ️  Guest Student already exists');
        }

        console.log('✅✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('🔌 Database connection closed');
        }
    }
}

seed();
