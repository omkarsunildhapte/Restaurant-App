import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistroyPage } from './histroy.page';

describe('HistroyPage', () => {
  let component: HistroyPage;
  let fixture: ComponentFixture<HistroyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistroyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
