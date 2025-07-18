import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminConfigComponent } from './admin-config.component';

describe('AdminConfigComponent', () => {
  let component: AdminConfigComponent;
  let fixture: ComponentFixture<AdminConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
