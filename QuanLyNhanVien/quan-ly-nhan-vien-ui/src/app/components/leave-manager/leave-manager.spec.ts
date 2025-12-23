import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveManagerComponent } from './leave-manager';

describe('LeaveManager', () => {
  let component: LeaveManagerComponent;
  let fixture: ComponentFixture<LeaveManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
