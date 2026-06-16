import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationContainer } from './navigation-container';

describe('NavigationContainer', () => {
  let component: NavigationContainer;
  let fixture: ComponentFixture<NavigationContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
