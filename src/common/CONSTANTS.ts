export const enum Tokens {
    ACCESS_TOKEN_COOKIE_NAME = 'access_token',
    REFRESH_TOKEN_COOKIE_NAME = 'refresh_token',
}

export const NAME_REGEX = /^[A-Za-z]+$/;
export const NAME_WITH_SPACE_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;

export const BCRYPT_HASH = /^\$2[aby]?\$[0-9]{2}\$[./A-Za-z0-9]{53}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PHONE_NUMBER_REGEX = /^\+?(\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

export const INVALID_AUTH_CREDENTIALS_MSG = 'Invalid email or password';

export const MAX_PREV_PASSWORDS = 3 as const;

export const PASSWORD_SALT_COUNT = 10 as const;

export const GRADE_REGEX = /^[A-F](\+|-|\*)*$/;

export const MAX_BOOK_ISSUE_LIMIT = 5;

// CACHE KEYS
export const enum CACHE_KEYS {
    CAY_ID = 'currentAcademicYearId'
}
