import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/toast-controller';
import { ToastService } from '@services/toast/toast.service';

describe('ToastService', () => {
  it('shows "Not connected yet"', async () => {
    const present = vi.fn().mockResolvedValue(undefined);
    const create = vi.fn().mockResolvedValue({ present });
    TestBed.configureTestingModule({ providers: [{ provide: ToastController, useValue: { create } }] });
    await TestBed.inject(ToastService).notConnected();
    expect(create).toHaveBeenCalledWith({ message: 'Not connected yet', duration: 2500, position: 'bottom', color: 'medium' });
    expect(present).toHaveBeenCalled();
  });
});
