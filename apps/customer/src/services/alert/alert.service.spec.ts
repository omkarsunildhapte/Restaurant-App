import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular/alert-controller';
import { AlertService } from '@services/alert/alert.service';

describe('AlertService', () => {
  it('creates and presents a styled alert', async () => {
    const present = vi.fn().mockResolvedValue(undefined);
    const create = vi.fn().mockResolvedValue({ present });
    TestBed.configureTestingModule({ providers: [{ provide: AlertController, useValue: { create } }] });
    await TestBed.inject(AlertService).present('Login', 'Login Successfully', 'success');
    expect(create).toHaveBeenCalledWith({ header: 'Login', message: 'Login Successfully', cssClass: 'alert-success', buttons: [{ text: 'OK', role: 'confirm', cssClass: 'alert-button-ok' }] });
    expect(present).toHaveBeenCalled();
  });
});
