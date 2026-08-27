import { Env } from '../types.js';

/**
 * Generate SHA-1 signature for Cloudinary authenticated API requests using Web Crypto API
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
 * Upload image or video to Cloudinary via server-side authenticated request
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
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);

  if (apiKey && apiSecret) {
    // Authenticated signed upload
    const folder = 'birthday_wish';
    const signature = await generateCloudinarySignature(
      {
        folder,
        timestamp,
      },
      apiSecret
    );

    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('signature', signature);
  } else if (env.CLOUDINARY_UPLOAD_PRESET) {
    // Unsigned preset upload fallback
    formData.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET);
  } else {
    throw new Error('Cloudinary API credentials or upload preset must be configured.');
  }

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const res = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as any;
    throw new Error(errData?.error?.message || `Cloudinary upload failed with status ${res.status}`);
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
 * Delete expired media asset from Cloudinary using authenticated server-side API
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video',
  env: Env
): Promise<{ success: boolean; result?: string; error?: string }> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      error: 'Cloudinary credentials (CLOUD_NAME, API_KEY, API_SECRET) are missing for deletion.',
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
      apiSecret
    );

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('invalidate', 'true');

    const destroyEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;
    const res = await fetch(destroyEndpoint, {
      method: 'POST',
      body: formData,
    });

    const data = (await res.json().catch(() => ({}))) as any;

    // Cloudinary returns { result: 'ok' } or { result: 'not found' }
    // If not found, it has already been deleted, so we treat it as successfully cleaned up (idempotent)
    if (res.ok && (data.result === 'ok' || data.result === 'not found')) {
      return { success: true, result: data.result };
    }

    return {
      success: false,
      error: data?.error?.message || data?.result || `Deletion returned status ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error during Cloudinary deletion',
    };
  }
}
