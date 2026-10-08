import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (environment.modoDemonstracao) {
    const sessaoSalva = typeof localStorage !== 'undefined' ? localStorage.getItem('elsushi_sessao_demo') : null;
    if (sessaoSalva) {
      return true;
    }
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const auth = inject(Auth);
  return user(auth).pipe(
    take(1),
    map(usuarioLogado => {
      if (usuarioLogado) return true;
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};