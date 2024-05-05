import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MypopoverPage } from './mypopover.page';

describe('MypopoverPage', () => {
  let component: MypopoverPage;
  let fixture: ComponentFixture<MypopoverPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MypopoverPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
