import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  credenciaisAcesso = {
    email: 'admin@elsushi.com',
    senha: 'demo'
  };

  carregando = signal(false);

  notificacaoAlerta = signal({
    visivel: false,
    mensagem: 'Verifique as informações preenchidas.',
    tipo: 'erro' as 'erro' | 'sucesso'
  });

  async entrar() {
    this.carregando.set(true);

    try {
      await this.auth.login(this.credenciaisAcesso.email, this.credenciaisAcesso.senha);
      const urlDestino = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
      await this.router.navigateByUrl(urlDestino);
    } catch {
      this.exibirNotificacao('E-mail ou senha incorretos.', 'erro');
    } finally {
      this.carregando.set(false);
    }
  }

  async entrarComoDemonstracao() {
    this.carregando.set(true);
    await this.auth.loginDemonstracao();
    this.carregando.set(false);
  }

  exibirNotificacao(mensagem: string, tipo: 'erro' | 'sucesso') {
    this.notificacaoAlerta.set({
      visivel: true,
      mensagem,
      tipo
    });
  }

  fecharNotificacao() {
    this.notificacaoAlerta.update(estado => ({ ...estado, visivel: false }));
  }
}