import { format } from "date-fns";
import { AuthUser, Role } from "src/common/types/global.type";
import { createHash } from 'crypto';

export const ISO_TIME = 'T00:00:00Z' as const;

export function startOfDayString(date: Date) {
    return format(date, 'yyyy-MM-dd') + ISO_TIME;
}

/**
 * checks if the user is a student
 * @param authUser the auth user
 * @returns true if the user is a student, false otherwise
 */
export function isStudent(authUser: AuthUser): authUser is Extract<AuthUser, { role: Role.STUDENT }> {
    return authUser.role === Role.STUDENT;
}

export function isAdmin(authUser: AuthUser): boolean {
    return ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(authUser.role as Role);
}

export function generateDeviceId(userAgent: string, ipAddress: string): string {
    return createHash('sha256').update(`${userAgent}-${ipAddress}`).digest('hex');
}

export function getLowerCasedFullName(firstName: string, lastName: string): string {
    return `${firstName?.trim()} ${lastName?.trim()}`.toLowerCase();
}
