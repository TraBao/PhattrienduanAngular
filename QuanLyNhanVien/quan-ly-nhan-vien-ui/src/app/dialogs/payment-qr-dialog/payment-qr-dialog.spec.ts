import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentQrDialog } from './payment-qr-dialog';

describe('PaymentQrDialog', () => {
  let component: PaymentQrDialog;
  let fixture: ComponentFixture<PaymentQrDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentQrDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentQrDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
