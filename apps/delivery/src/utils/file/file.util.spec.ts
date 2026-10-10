import { firstPickedFile, readAsDataUrl } from '@utils/file/file.util';

describe('file.util', () => {
  it('reads a blob as a data URL', async () => {
    const url = await readAsDataUrl(new Blob(['hi'], { type: 'text/plain' }));
    expect(url.startsWith('data:text/plain')).toBe(true);
  });

  it('returns the first picked file or null', () => {
    const input = document.createElement('input');
    input.type = 'file';
    expect(firstPickedFile({ target: input } as unknown as Event)).toBeNull();
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: { item: (i: number) => (i === 0 ? file : null) } });
    expect(firstPickedFile({ target: input } as unknown as Event)).toBe(file);
    expect(firstPickedFile({ target: null } as unknown as Event)).toBeNull();
  });
});
