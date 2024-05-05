import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FoodPagePage } from './food-page.page';

describe('FoodPagePage', () => {
  let component: FoodPagePage;
  let fixture: ComponentFixture<FoodPagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FoodPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
