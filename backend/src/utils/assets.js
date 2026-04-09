import fs from 'node:fs/promises';
import path from 'node:path';

export const toStoredAssetPath = (filePath = '') => path.relative(process.cwd(), filePath).replace(/\\/g, '/');

export const toPublicAssetUrl = (req, assetPath = '') => {
  if (!assetPath) {
    return null;
  }

  const normalizedPath = assetPath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${req.protocol}://${req.get('host')}/${normalizedPath}`;
};

export const removeStoredAsset = async (assetPath = '') => {
  if (!assetPath) {
    return;
  }

  const resolvedPath = path.join(process.cwd(), assetPath);

  try {
    await fs.unlink(resolvedPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};
