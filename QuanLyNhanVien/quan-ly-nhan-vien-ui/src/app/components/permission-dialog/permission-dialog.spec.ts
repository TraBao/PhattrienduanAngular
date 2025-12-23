import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionDialogComponent } from './permission-dialog';

describe('PermissionDialog', () => {
  let component: PermissionDialogComponent;
  let fixture: ComponentFixture<PermissionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
