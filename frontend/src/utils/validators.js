export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export function validatePhone(phone) {
  if (!phone) return true;
  return /^\+?[0-9\s\-()]{7,20}$/.test(phone);
}
