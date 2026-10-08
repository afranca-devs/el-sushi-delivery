import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './admin-layout.html',    
  styleUrl: './admin-layout.scss'       
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);

  usuarioLogado = toSignal(this.auth.user$);

  podeVerRelatorios(): boolean {
    return true;
  }

  async sair() {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}