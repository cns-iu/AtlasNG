import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LinkSnippet } from './link-snippet';

describe('LinkSnippet', () => {
  let component: LinkSnippet;
  let fixture: ComponentFixture<LinkSnippet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkSnippet],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkSnippet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
