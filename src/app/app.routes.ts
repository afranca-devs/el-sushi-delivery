import { Routes } from '@angular/router';
import { CardapioComponent } from './features/cardapio/cardapio';
import { CarrinhoComponent } from './features/carrinho/carrinho';
import { LoginComponent } from './features/login/login';
import { AdminLayoutComponent } from './features/admin-layout/admin-layout';
import { PainelPedidosComponent } from './features/painel-pedidos/painel-pedidos'; 
import { authGuard } from './core/guards/auth.guard';

import { AdminProdutosComponent } from './features/admin-produtos/admin-produtos';
import { AdminVendasComponent } from './features/admin-vendas/admin-vendas';
import { AdminNotaComponent } from './features/admin-nota/admin-nota';

export const routes: Routes = [
  { path: '', component: CardapioComponent },
  { path: 'carrinho', component: CarrinhoComponent },
  { path: 'login', component: LoginComponent },

  { 
    path: 'admin', 
    component: AdminLayoutComponent, 
    canActivate: [authGuard],        
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      { path: 'dashboard', component: PainelPedidosComponent }, 
      
      { path: 'cardapio', component: AdminProdutosComponent },

      { path: 'notas', component: AdminNotaComponent },
      { path: 'vendas', component: AdminVendasComponent },
    ]
  },

  { path: '**', redirectTo: '' }
];