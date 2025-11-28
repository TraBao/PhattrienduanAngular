import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAnnouncements } from './admin-announcements';

describe('AdminAnnouncements', () => {
  let component: AdminAnnouncements;
  let fixture: ComponentFixture<AdminAnnouncements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnnouncements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAnnouncements);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
