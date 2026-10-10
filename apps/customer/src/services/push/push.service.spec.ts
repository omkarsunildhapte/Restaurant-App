import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PushService } from '@services/push/push.service';

const fcm = vi.hoisted(() => ({ isSupported: vi.fn(), getToken: vi.fn(), onMessage: vi.fn(), getMessaging: vi.fn(() => ({})) }));

vi.mock('firebase/app', () => ({ getApps: () => [], getApp: vi.fn(), initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/messaging', () => fcm);

describe('PushService', () => {
  beforeEach(() => Object.values(fcm).forEach((f) => f.mockClear()));

  it('returns null where FCM is not supported', async () => {
    fcm.isSupported.mockResolvedValue(false);
    await expect(TestBed.inject(PushService).requestToken()).resolves.toBeNull();
    expect(fcm.getToken).not.toHaveBeenCalled();
  });

  it('returns the FCM token once permission is granted', async () => {
    fcm.isSupported.mockResolvedValue(true);
    fcm.getToken.mockResolvedValue('fcm-token');
    Object.assign(globalThis, { Notification: { requestPermission: vi.fn().mockResolvedValue('granted') } });
    await expect(TestBed.inject(PushService).requestToken('vapid')).resolves.toBe('fcm-token');
    expect(fcm.getToken).toHaveBeenCalledWith({}, { vapidKey: 'vapid' });
  });

  it('does nothing during server rendering', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(PushService);
    await expect(service.requestToken()).resolves.toBeNull();
    const unsubscribe = await service.onForegroundMessage(vi.fn());
    expect(unsubscribe()).toBeUndefined();
    expect(fcm.isSupported).not.toHaveBeenCalled();
  });
});
