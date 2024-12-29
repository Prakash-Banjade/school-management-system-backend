import { AcademicYear } from "src/academic-years/entities/academic-year.entity";
import * as crypto from 'crypto';

export function getRegistrationNumber(academicYear: AcademicYear) {
    const min = 100000;
    const max = 999999;
    return new Date(academicYear.startDate ?? new Date()).getFullYear() + '-' + crypto.randomInt(min, max + 1);
}