import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationCategoryToggle } from './navigation-category-toggle';

describe('NavigationCategoryToggle', () => {
  let component: NavigationCategoryToggle;
  let fixture: ComponentFixture<NavigationCategoryToggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationCategoryToggle],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationCategoryToggle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
