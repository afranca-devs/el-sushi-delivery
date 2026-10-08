import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminNotaComponent } from './admin-nota';

describe('AdminNotaComponent', () => {
  let component: AdminNotaComponent;
  let fixture: ComponentFixture<AdminNotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNotaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});