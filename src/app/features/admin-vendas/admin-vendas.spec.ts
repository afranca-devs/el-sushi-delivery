import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVendas } from './admin-vendas';

describe('AdminVendas', () => {
  let component: AdminVendas;
  let fixture: ComponentFixture<AdminVendas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminVendas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminVendas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
