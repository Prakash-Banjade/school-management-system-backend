import { randomBytes } from 'crypto';

export const generateRandomPassword = () => {
  return randomBytes(8).toString('hex');
};