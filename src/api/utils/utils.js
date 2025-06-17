export function formatNumber(value) {
  return value?.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function generateStrongPassword(length = 12) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%&_.?";
  const all = upper + lower + digits + symbols;

  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  return password.sort(() => Math.random() - 0.5).join("");
}
