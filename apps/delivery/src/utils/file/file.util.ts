/** Reads a file as a data URL (used for the document image previews). */
export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** The first file picked in a file input's change event, or null. */
export function firstPickedFile(event: Event): File | null {
  const input = event.target as HTMLInputElement | null;
  return input?.files?.item(0) ?? null;
}
