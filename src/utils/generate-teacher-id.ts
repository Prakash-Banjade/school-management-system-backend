import * as crypto from 'crypto'

export function generateTeacherId() {
    const min = 100000;
    const max = 999999;
    return crypto.randomInt(min, max + 1);
}