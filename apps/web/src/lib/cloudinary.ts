const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'napiri_menu';

export async function uploadImage(file: File): Promise<string> {
  if (!CLOUD_NAME) throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error('სურათის ატვირთვა ვერ მოხერხდა');
  const data = await res.json();
  return data.secure_url as string;
}
