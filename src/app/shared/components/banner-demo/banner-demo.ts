import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArmazenamentoDemoService } from '../../../core/services/armazenamentoDemo.service';

@Component({
  selector: 'app-banner-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner-demo.html',
  styleUrl: './banner-demo.scss'
})
export class BannerDemoComponent {
  private armazenamentoService = inject(ArmazenamentoDemoService);

  visivel = signal(true);
  restauradoSucesso = signal(false);

  restaurarDados(): void {
    this.armazenamentoService.restaurarDemonstracao();
    this.restauradoSucesso.set(true);
    setTimeout(() => {
      this.restauradoSucesso.set(false);
      window.location.reload();
    }, 800);
  }

  fecharBanner(): void {
    this.visivel.set(false);
  }
}
