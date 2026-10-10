import { NotImplementedError, notImplemented } from '@utils/not-implemented/not-implemented.util';

describe('notImplemented', () => {
  it('rejects with a NotImplementedError naming the operation', async () => {
    await expect(notImplemented('place order')).rejects.toBeInstanceOf(NotImplementedError);
    await expect(notImplemented('place order')).rejects.toThrow('Not connected yet: place order');
  });

  it('names the error', () => {
    expect(new NotImplementedError('x').name).toBe('NotImplementedError');
  });
});
