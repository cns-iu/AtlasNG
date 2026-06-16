import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkipToContentButton } from './skip-to-content-button';

describe('SkipToContentButton', () => {
  let component: SkipToContentButton;
  let fixture: ComponentFixture<SkipToContentButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkipToContentButton],
    }).compileComponents();

    fixture = TestBed.createComponent(SkipToContentButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
