import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { CookiePermissions } from './cookie-permissions';

describe('CookiePermissions', () => {
  let component: CookiePermissions;
  let fixture: ComponentFixture<CookiePermissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookiePermissions],
    }).compileComponents();

    fixture = TestBed.createComponent(CookiePermissions);
    fixture.componentRef.setInput('permissions', {
      [AnalyticsEventCategory.Necessary]: true,
      [AnalyticsEventCategory.Preferences]: false,
      [AnalyticsEventCategory.Statistics]: false,
      [AnalyticsEventCategory.Marketing]: false,
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
