import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsManagerComponent } from './forms-manager';

describe('FormsManager', () => {
  let component: FormsManagerComponent;
  let fixture: ComponentFixture<FormsManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
