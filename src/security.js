import path from 'node:path';

/**
 * @returns {string[]}
 */
export function getAllowedRoots() {
  const env = process.env.AYWEBP_ALLOWED_ROOTS;
  if (env && env.trim()) {
    return env
      .split(',')
      .map((entry) => path.resolve(entry.trim()))
      .filter(Boolean);
  }
  return [process.cwd()];
}

/**
 * @param {string} targetPath
 * @param {string[] | undefined} allowedRoots
 * @returns {string}
 */
export function assertPathAllowed(targetPath, allowedRoots = getAllowedRoots()) {
  const resolved = path.resolve(targetPath);

  const isAllowed = allowedRoots.some((root) => {
    const relative = path.relative(root, resolved);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });

  if (!isAllowed) {
    throw new Error(
      `Path not allowed: ${resolved}. Must be under: ${allowedRoots.join(', ')}`,
    );
  }

  return resolved;
}
