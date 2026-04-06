import crypto from "crypto";

export function formatNumber(value) {
  return value?.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

const randomIndex = (max) => crypto.randomInt(0, max);

export function generateStrongPassword(length = 12) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%&_.?";
  const all = upper + lower + digits + symbols;

  let password = [
    upper[randomIndex(upper.length)],
    symbols[randomIndex(symbols.length)],
    lower[randomIndex(lower.length)],
    digits[randomIndex(digits.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[randomIndex(all.length)]);
  }

  for (let i = password.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}
