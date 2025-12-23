import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiWidgetComponent } from './ai-widget';

describe('AiWidget', () => {
  let component: AiWidgetComponent;
  let fixture: ComponentFixture<AiWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
