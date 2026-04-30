// Cloudinary unsigned upload utility
// Uses an unsigned upload preset — safe to call from the browser.
// No secret key required; access control is enforced by Cloudinary's preset config.

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return `Tipo não suportado: ${file.type}. Use JPG, PNG, WebP ou GIF.`;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: ${MAX_FILE_SIZE_MB} MB.`;
  return null;
}

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET)
    throw new CloudinaryUploadError('Cloudinary não configurado. Verifique NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME e NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET no .env.local.');

  const validation = validateImageFile(file);
  if (validation) throw new CloudinaryUploadError(validation);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'blockflip');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new CloudinaryUploadError(err?.error?.message ?? `Upload falhou (HTTP ${res.status})`);
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

export async function uploadMultiple(
  files: File[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadToCloudinary(files[i]);
    urls.push(url);
    onProgress?.(i + 1, files.length);
  }
  return urls;
}
