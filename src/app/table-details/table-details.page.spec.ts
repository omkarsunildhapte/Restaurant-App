import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableDetailsPage } from './table-details.page';

describe('TableDetailsPage', () => {
  let component: TableDetailsPage;
  let fixture: ComponentFixture<TableDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TableDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
