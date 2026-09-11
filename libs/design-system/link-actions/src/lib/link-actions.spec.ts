import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LinkActions } from './link-actions';

describe('LinkActions', () => {
  let component: LinkActions;
  let fixture: ComponentFixture<LinkActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkActions],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkActions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
