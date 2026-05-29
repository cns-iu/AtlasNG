import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionLink } from './section-link';

describe('SectionLink', () => {
  let component: SectionLink;
  let fixture: ComponentFixture<SectionLink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionLink],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionLink);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
