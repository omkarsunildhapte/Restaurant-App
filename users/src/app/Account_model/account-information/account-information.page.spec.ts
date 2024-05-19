import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountInformationPage } from './account-information.page';

describe('AccountInformationPage', () => {
  let component: AccountInformationPage;
  let fixture: ComponentFixture<AccountInformationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountInformationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
