import { dataUrlToBlob, isDataUrl, shrinkImage } from '@utils/image/image.util';

const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('image util', () => {
  it('tells picked images from saved photo URLs', () => {
    expect(isDataUrl(PNG_1PX)).toBe(true);
    expect(isDataUrl('https://example.test/storage/v1/object/sign/x.jpg?token=1')).toBe(false);
  });

  it('turns a data URL into a Blob of its type', async () => {
    const blob = dataUrlToBlob(PNG_1PX);
    expect(blob.type).toBe('image/png');
    const signature = new Uint8Array(await blob.arrayBuffer()).slice(0, 4);
    expect([...signature]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it('returns the original image when it cannot be drawn (no canvas here)', async () => {
    const blob = await shrinkImage(PNG_1PX, document);
    expect(blob.type).toBe('image/png');
  });
});
