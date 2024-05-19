import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FoodReviewPage } from './food-review.page';

describe('FoodReviewPage', () => {
  let component: FoodReviewPage;
  let fixture: ComponentFixture<FoodReviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FoodReviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
