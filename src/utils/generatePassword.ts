import { randomBytes } from 'crypto';

export const generateRandomPassword = () => {
  return randomBytes(20).toString('hex');
};