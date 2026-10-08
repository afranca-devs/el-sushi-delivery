import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelPedidos } from './painel-pedidos';

describe('PainelPedidos', () => {
  let component: PainelPedidos;
  let fixture: ComponentFixture<PainelPedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelPedidos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelPedidos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
