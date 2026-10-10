import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { AlertService } from '@services/alert/alert.service';
import { NotImplementedError } from '@utils/errors/errors.util';
import { ALERT } from '@constants/alert.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';

describe('AlertService', () => {
  const present = vi.fn(async () => undefined);
  const alertCreate = vi.fn(async () => ({ present }));
  const toastCreate = vi.fn(async () => ({ present }));
  let service: AlertService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: AlertController, useValue: { create: alertCreate } },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    service = TestBed.inject(AlertService);
  });

  it('presents an alert styled for its kind', async () => {
    await service.presentAlert('Title', 'Body', 'success');
    expect(alertCreate).toHaveBeenCalledWith(expect.objectContaining({ header: 'Title', message: 'Body', cssClass: ALERT.CSS_CLASS.success }));
    expect(present).toHaveBeenCalled();
  });

  it('shows the error message, or the fallback when there is none', async () => {
    await service.presentError('Oops', new Error('broken'));
    expect(alertCreate).toHaveBeenLastCalledWith(expect.objectContaining({ message: 'broken', cssClass: ALERT.CSS_CLASS.error }));
    await service.presentError('Oops', 'x');
    expect(alertCreate).toHaveBeenLastCalledWith(expect.objectContaining({ message: ERROR_MESSAGES.GENERIC }));
  });

  it('toasts "Not connected yet" for a stubbed save and alerts anything else', async () => {
    await service.saveFailed('Save', new NotImplementedError('save'));
    expect(toastCreate).toHaveBeenCalledWith(expect.objectContaining({ message: ERROR_MESSAGES.NOT_CONNECTED }));
    await service.saveFailed('Save', new Error('network'));
    expect(alertCreate).toHaveBeenLastCalledWith(expect.objectContaining({ message: 'network' }));
  });
});
