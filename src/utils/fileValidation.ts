/**
 * Strict file validator to prevent empty, synthetic, or invalid file upload attempts
 */
export function isValidUploadFile(file: unknown): file is File {
  if (!file || typeof file !== 'object') {
    return false;
  }

  // Verify File constructor if available in environment
  if (typeof File !== 'undefined' && !(file instanceof File)) {
    return false;
  }

  const f = file as File;

  // Name must be non-empty string
  if (typeof f.name !== 'string' || f.name.trim().length === 0) {
    return false;
  }

  // Size must be positive number (> 0 bytes)
  if (typeof f.size !== 'number' || f.size <= 0 || isNaN(f.size)) {
    return false;
  }

  return true;
}
