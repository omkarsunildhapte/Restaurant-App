import { TestBed } from '@angular/core/testing';
import { NavController } from '@ionic/angular/nav-controller';
import { NavigationService } from '@services/navigation/navigation.service';

describe('NavigationService', () => {
  it('navigates forward and to a new root through Ionic', async () => {
    const navController = { navigateForward: vi.fn(async () => true), navigateRoot: vi.fn(async () => true) };
    TestBed.configureTestingModule({ providers: [{ provide: NavController, useValue: navController }] });
    const service = TestBed.inject(NavigationService);
    await service.forward('/order');
    await service.root('/login');
    expect(navController.navigateForward).toHaveBeenCalledWith('/order');
    expect(navController.navigateRoot).toHaveBeenCalledWith('/login');
  });
});
