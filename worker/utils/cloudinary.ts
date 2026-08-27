import { Env } from '../types.js';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Validates and retrieves server-side Cloudinary configuration.
 * Throws an explicit error if any required secret is missing.
 */
export function getCloudinaryConfig(env: Env): CloudinaryConfig {
  const missing: string[] = [];
  if (!env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length > 0) {
    console.warn(`[Cloudinary Config] Missing environment variable(s): ${missing.join(', ')}`);
    throw new Error('Media storage is not configured on the server.');
  }

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    apiSecret: env.CLOUDINARY_API_SECRET!,
  };
}

/**
 * Generates a SHA-1 signature for Cloudinary authenticated API requests using Web Crypto API.
 */
export async function generateCloudinarySignature(
  params: Record<string, string | number | boolean>,
  apiSecret: string
): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  const toSign = `${serialized}${apiSecret}`;
  const msgUint8 = new TextEncoder().encode(toSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Uploads an image or video file to Cloudinary via server-side signed request.
 */
export async function uploadToCloudinary(
  file: File,
  resourceType: 'image' | 'video',
  env: Env
): Promise<{
  secure_url: string;
  public_id: string;
  asset_id: string;
  resource_type: 'image' | 'video';
}> {
  const config = getCloudinaryConfig(env);

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'birthday_wish';

  const signature = await generateCloudinarySignature(
    {
      folder,
      timestamp,
    },
    config.apiSecret
  );

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;
  const res = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as any;
    console.error('[Cloudinary Upload Error]', res.status, errorBody);
    const serverMessage = errorBody?.error?.message || `Cloudinary upload failed with status ${res.status}`;
    throw new Error(serverMessage);
  }

  const data = (await res.json()) as any;
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    asset_id: data.asset_id || data.public_id,
    resource_type: (data.resource_type as 'image' | 'video') || resourceType,
  };
}

/**
 * Deletes an expired media asset from Cloudinary using authenticated signed request.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video',
  env: Env
): Promise<{ success: boolean; result?: string; error?: string }> {
  let config: CloudinaryConfig;
  try {
    config = getCloudinaryConfig(env);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Cloudinary credentials missing for deletion',
    };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateCloudinarySignature(
      {
        invalidate: true,
        public_id: publicId,
        timestamp,
      },
      config.apiSecret
    );

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', config.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('invalidate', 'true');

    const destroyEndpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`;
    const res = await fetch(destroyEndpoint, {
      method: 'POST',
      body: formData,
    });

    const data = (await res.json().catch(() => ({}))) as any;

    // Cloudinary returns { result: 'ok' } or { result: 'not found' }
    // If 'not found', it has already been deleted, so treat as successfully cleaned up (idempotent)
    if (res.ok && (data.result === 'ok' || data.result === 'not found')) {
      return { success: true, result: data.result };
    }

    console.error('[Cloudinary Destroy Error]', res.status, data);
    return {
      success: false,
      error: data?.error?.message || data?.result || `Deletion returned status ${res.status}`,
    };
  } catch (err: any) {
    console.error('[Cloudinary Destroy Exception]', err);
    return {
      success: false,
      error: err.message || 'Network error during Cloudinary deletion',
    };
  }
}
