import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddCartPage } from './add-cart.page';

describe('AddCartPage', () => {
  let component: AddCartPage;
  let fixture: ComponentFixture<AddCartPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
