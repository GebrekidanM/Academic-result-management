export function parseExcelDate(value)  {
  if (!value) return null;

  // 1️⃣ If it's an Excel number (e.g., 45234)
  if (typeof value === 'number') {
    // Excel counts days since Jan 1, 1900
    const excelEpoch = new Date(1900, 0, 1);
    return new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000); 
  }

  // 2️⃣ If it's a string with slashes
  if (typeof value === 'string') {
    const parts = value.split(/[\/\-]/).map(Number);

    if (parts.length === 3) {
      let [a, b, c] = parts;

      // Guess format
      if (a > 12) {
        // DD/MM/YYYY
        return new Date(c, b - 1, a);
      } else if (b > 12) {
        // MM/DD/YYYY
        return new Date(c, a - 1, b);
      } else {
        // Default to DD/MM/YYYY
        return new Date(c, b - 1, a);
      }
    }
  }

  // 3️⃣ Fallback - try native parser
  return new Date(value);
}
