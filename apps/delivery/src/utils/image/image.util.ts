import { DOCUMENT_IMAGE } from '@constants/personal-document.constants';

/** True for an image picked on this device (data URL), as opposed to a saved photo's signed URL. */
export function isDataUrl(value: string): boolean {
  return value.startsWith(DOCUMENT_IMAGE.DATA_URL_PREFIX);
}

/** A base64 data URL as a Blob with its own type. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header = '', base64 = ''] = dataUrl.split(',');
  const type = header.slice(DOCUMENT_IMAGE.DATA_URL_PREFIX.length).split(';')[0] ?? '';
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

/**
 * The picked photo, scaled down to at most MAX_SIDE_PX on its longest side and re-encoded as JPEG,
 * so a phone camera photo fits the bucket's 2 MB limit. Without a canvas (server, tests) the
 * original image is returned unchanged. Browser-only: call from a user action.
 */
export async function shrinkImage(dataUrl: string, doc: Document): Promise<Blob> {
  const img = doc.createElement('img');
  img.src = dataUrl;
  try {
    await img.decode();
  } catch {
    return dataUrlToBlob(dataUrl);
  }
  const scale = Math.min(1, DOCUMENT_IMAGE.MAX_SIDE_PX / Math.max(img.naturalWidth, img.naturalHeight, 1));
  const canvas = doc.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const context = canvas.getContext(DOCUMENT_IMAGE.CANVAS_2D);
  if (!context) {
    return dataUrlToBlob(dataUrl);
  }
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, DOCUMENT_IMAGE.OUTPUT_MIME, DOCUMENT_IMAGE.QUALITY));
  return blob ?? dataUrlToBlob(dataUrl);
}
