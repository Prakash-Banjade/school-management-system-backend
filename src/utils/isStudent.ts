import { AuthUser, Role } from "src/common/types/global.type";


/**
 * checks if the user is a student
 * @param authUser the auth user
 * @returns true if the user is a student, false otherwise
 */
export function isStudent(authUser: AuthUser): authUser is Extract<AuthUser, { role: Role.STUDENT }> {
    return authUser.role === Role.STUDENT;
}