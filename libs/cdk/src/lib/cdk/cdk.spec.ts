import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cdk } from './cdk';

describe('Cdk', () => {
  let component: Cdk;
  let fixture: ComponentFixture<Cdk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cdk],
    }).compileComponents();

    fixture = TestBed.createComponent(Cdk);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
