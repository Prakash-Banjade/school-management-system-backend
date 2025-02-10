import { randomBytes } from 'crypto';

export const generateRandomPassword = () => {
  return randomBytes(4).toString('hex');
};