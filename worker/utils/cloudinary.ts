import { Env } from '../types.js';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
}

/**
 * Validates and retrieves server-side Cloudinary configuration.
 * Trims whitespace and strips any accidental quotes from secrets.
 */
export function getCloudinaryConfig(env: Env): CloudinaryConfig {
  const cleanSecret = (val?: string) => {
    if (!val) return undefined;
    let s = val.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim();
    }
    return s;
  };

  const cloudName = cleanSecret(env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanSecret(env.CLOUDINARY_API_KEY);
  const apiSecret = cleanSecret(env.CLOUDINARY_API_SECRET);
  const uploadPreset = cleanSecret(env.CLOUDINARY_UPLOAD_PRESET);

  if (!cloudName) {
    console.warn('[Cloudinary Config] Missing CLOUDINARY_CLOUD_NAME');
    throw new Error('Media storage is not configured on the server (missing CLOUDINARY_CLOUD_NAME).');
  }

  // Either (apiKey + apiSecret) for signed uploads OR uploadPreset for unsigned uploads
  if ((!apiKey || !apiSecret) && !uploadPreset) {
    console.warn('[Cloudinary Config] Missing CLOUDINARY_API_KEY/SECRET or CLOUDINARY_UPLOAD_PRESET');
    throw new Error('Media storage is not configured on the server (requires CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET or CLOUDINARY_UPLOAD_PRESET).');
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
  };
}

/**
 * Standard Web Crypto SHA-1 digest returning lowercase hex string
 */
export async function sha1(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a SHA-1 signature for Cloudinary authenticated API requests.
 * Sorts parameters alphabetically and appends API secret directly without delimiters.
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
  return sha1(toSign);
}

/**
 * Uploads an image or video file to Cloudinary via server-side signed request or upload preset.
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
  const folder = 'birthday_wish';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  if (config.apiKey && config.apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    // 1. Exact string to sign with alphabetically sorted params
    const stringToSign = `folder=${folder}&timestamp=${timestamp}`;

    // 2. Append apiSecret directly to stringToSign
    const signature = await sha1(stringToSign + config.apiSecret);

    // 3. Diagnostic logging without exposing secret
    console.log('[Cloudinary Signed Upload]', {
      cloudinaryCloudName: config.cloudName,
      apiKeyPresent: Boolean(config.apiKey),
      apiSecretLength: config.apiSecret.length,
      stringToSign,
      timestamp,
      folder,
      signature,
    });

    formData.append('api_key', config.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
  } else if (config.uploadPreset) {
    console.log('[Cloudinary Unsigned Upload Preset]', {
      cloudName: config.cloudName,
      uploadPreset: config.uploadPreset,
    });
    formData.append('upload_preset', config.uploadPreset);
  }

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

  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      error: 'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET required for automated deletion',
    };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // Alphabetically sorted parameters: invalidate, public_id, timestamp
    const stringToSign = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = await sha1(stringToSign + config.apiSecret);

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
