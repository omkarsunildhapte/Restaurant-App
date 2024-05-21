import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTableComponent } from './new-table.component';

describe('NewTableComponent', () => {
  let component: NewTableComponent;
  let fixture: ComponentFixture<NewTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
