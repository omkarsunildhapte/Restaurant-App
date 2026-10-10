import { TestBed } from '@angular/core/testing';
import { ConfirmService } from './confirm.service';
import { ToastService } from './toast.service';

describe('ConfirmService', () => {
  it('resolves true when accepted and clears the pending request', async () => {
    const confirm = TestBed.inject(ConfirmService);
    const result = confirm.confirm({ message: 'Delete?' });
    expect(confirm.pending()?.message).toBe('Delete?');

    confirm.respond(true);
    await expect(result).resolves.toBe(true);
    expect(confirm.pending()).toBeNull();
  });

  it('resolves false for a superseded request', async () => {
    const confirm = TestBed.inject(ConfirmService);
    const first = confirm.confirm({ message: 'First' });
    confirm.confirm({ message: 'Second' });
    await expect(first).resolves.toBe(false);
  });
});

describe('ToastService', () => {
  afterEach(() => vi.useRealTimers());

  it('adds a toast and auto-dismisses it after its life', () => {
    vi.useFakeTimers();
    const toasts = TestBed.inject(ToastService);
    toasts.add({ severity: 'info', summary: 'Hi', life: 1000 });
    expect(toasts.toasts().length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(toasts.toasts().length).toBe(0);
  });

  it('can be dismissed manually', () => {
    const toasts = TestBed.inject(ToastService);
    const id = toasts.error('Boom');
    expect(toasts.toasts()[0]).toEqual(expect.objectContaining({ severity: 'error', detail: 'Boom' }));
    toasts.dismiss(id);
    expect(toasts.toasts().length).toBe(0);
  });
});
