import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacao.html', 
  styleUrls: ['./modal-confirmacao.scss']  
})
export class ModalConfirmacaoComponent {
  @Input() titulo: string = 'Atenção';
  @Input() icone: string = '⚠️';
  @Input() textoConfirmar: string = 'CONFIRMAR';
  @Input() textoCancelar: string = 'VOLTAR';
  @Input() tipo: 'perigo' | 'sucesso' | 'padrao' = 'perigo';
  @Input() esconderCancelar: boolean = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}