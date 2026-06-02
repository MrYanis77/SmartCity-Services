const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

/** URL affichable pour une photo stockée côté serveur ou localement. */
export function getPhotoUrl(photoPath: string | null | undefined): string | null {
  if (!photoPath) return null;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
    return photoPath;
  }
  return `${API_URL}/api/images?path=${encodeURIComponent(photoPath)}`;
}

/** Encode un fichier image en base64 pour l'upload API. */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
