import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDocs } from './employee-docs';

describe('EmployeeDocs', () => {
  let component: EmployeeDocs;
  let fixture: ComponentFixture<EmployeeDocs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDocs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeDocs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
