import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  usuarioDemoAtivo = signal<any>(this.obterUsuarioDemoSalvo());

  user$: Observable<any> = environment.modoDemonstracao
    ? of(this.usuarioDemoAtivo())
    : user(this.auth);

  private obterUsuarioDemoSalvo(): any {
    if (typeof localStorage === 'undefined') return null;
    const sessao = localStorage.getItem('elsushi_sessao_demo');
    return sessao ? JSON.parse(sessao) : null;
  }

  async login(email: string, senha: string): Promise<void> {
    if (environment.modoDemonstracao) {
      return this.loginDemonstracao();
    }
    await signInWithEmailAndPassword(this.auth, email, senha);
  }

  async loginDemonstracao(): Promise<void> {
    const usuarioMock = {
      uid: 'admin_demo_123',
      email: 'admin@elsushi.com',
      displayName: 'Administrador Demo'
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('elsushi_sessao_demo', JSON.stringify(usuarioMock));
    }
    this.usuarioDemoAtivo.set(usuarioMock);
    this.user$ = of(usuarioMock);
    await this.router.navigate(['/admin/dashboard']);
  }

  async logout(): Promise<void> {
    if (environment.modoDemonstracao) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('elsushi_sessao_demo');
      }
      this.usuarioDemoAtivo.set(null);
      this.user$ = of(null);
      await this.router.navigate(['/login']);
      return;
    }
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }
}