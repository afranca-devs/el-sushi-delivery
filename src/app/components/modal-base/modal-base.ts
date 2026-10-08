import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-base',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-base.html',
  styleUrls: ['./modal-base.scss']  
})
export class ModalBaseComponent {
  @Input() titulo: string = '';
  @Input() maxWidth: string = '500px'; 
  
  @Output() fechar = new EventEmitter<void>();

  emitirFechar() {
    this.fechar.emit();
  }
}