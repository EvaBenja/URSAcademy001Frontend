// Compression des photos avant envoi : économise la data mobile et accélère la boutique.
export async function compresserImage(file: File, maxSide = 1280, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const ratio = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * ratio));
    const h = Math.max(1, Math.round(bmp.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

// Numéro WhatsApp au format international sans "+" (Burkina : 8 chiffres => préfixe 226)
export function numeroWhatsApp(brut?: string | null): string | null {
  if (!brut) return null;
  let n = brut.replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (n.length === 8) n = '226' + n;
  return n.length >= 10 ? n : null;
}

export function lienWhatsApp(brut: string | null | undefined, message: string): string | null {
  const n = numeroWhatsApp(brut);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : null;
}

export const lienBoutiquePublique = (code?: string | null) =>
  code ? `${window.location.origin}/boutique/${code}` : '';

export const nettoyerNom = (nom?: string): string =>
  (nom || '').replace(/(\[Arch[ié]v[eé]\]\s*)*/gi, '').trim();
