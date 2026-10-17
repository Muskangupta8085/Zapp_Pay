export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCryptoAddress = (address: string): boolean => {
  // Checks standard 42-character hex address format (0x...)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
