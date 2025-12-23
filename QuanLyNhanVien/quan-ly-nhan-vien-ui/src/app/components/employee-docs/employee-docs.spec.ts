import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDocsComponent } from './employee-docs';

describe('EmployeeDocs', () => {
  let component: EmployeeDocsComponent;
  let fixture: ComponentFixture<EmployeeDocsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDocsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
