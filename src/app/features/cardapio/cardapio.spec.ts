import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cardapio } from './cardapio';

describe('Cardapio', () => {
  let component: Cardapio;
  let fixture: ComponentFixture<Cardapio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cardapio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cardapio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
