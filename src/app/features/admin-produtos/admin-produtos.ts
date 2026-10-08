import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardapioService } from '../../core/services/cardapio.service';
import { Produto } from '../../core/models/produto.model';
import { AuthService } from '../../core/services/auth'; 
import { toSignal } from '@angular/core/rxjs-interop'; 
import { ModalBaseComponent } from '../../components/modal-base/modal-base';
import { ModalConfirmacaoComponent } from '../../components/modal-confirmacao/modal-confirmacao';

@Component({
  selector: 'app-admin-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalBaseComponent, ModalConfirmacaoComponent],
  templateUrl: './admin-produtos.html',
  styleUrl: './admin-produtos.scss'
})
export class AdminProdutosComponent implements OnInit {
  cardapioService = inject(CardapioService);
  authService = inject(AuthService); 

  usuarioLogado = toSignal(this.authService.user$);
  
  isAdmin(): boolean {
    return true;
  }

  produtos = signal<Produto[]>([]);
  mostrarFormulario = signal(false);

  mostrarSucesso = signal(false);
  mensagemSucesso = signal('Operação realizada com sucesso.');  

  mostrarConfirmacaoDeletar = signal(false);
  produtoParaDeletar: Produto | null = null;

  produtoAtual: Produto = this.criarProdutoPadrao();

  ngOnInit() {
    this.buscarProdutosTempoReal();
  }

  buscarProdutosTempoReal() {
    this.cardapioService.obterProdutos().subscribe((lista) => {
      this.produtos.set(lista);
    });
  }

  novoProduto() {
    if (!this.isAdmin()) return; 
    this.produtoAtual = this.criarProdutoPadrao();
    this.mostrarFormulario.set(true);
  }

  editar(produto: Produto) {
    if (!this.isAdmin()) return;
    this.produtoAtual = { ...produto };
    this.mostrarFormulario.set(true);
  }

  fecharModal() {
    this.mostrarFormulario.set(false);
  }

  async salvar() {
    if (!this.isAdmin()) return; 
    if (!this.produtoAtual.nome) return;
    try {
      const ehEdicao = !!this.produtoAtual.id;

      if (ehEdicao) {
        await this.cardapioService.atualizar(this.produtoAtual);
        this.mensagemSucesso.set('Prato atualizado com sucesso!');
      } else {
        await this.cardapioService.adicionar(this.produtoAtual);
        this.mensagemSucesso.set('Novo prato adicionado ao cardápio!');
      }

      this.fecharModal();
      this.exibirFeedbackSucesso(); 
    } catch {
    }
  }

  exibirFeedbackSucesso() {
    this.mostrarSucesso.set(true);
    setTimeout(() => {
      this.fecharModalSucesso();
    }, 2500);
  }

  fecharModalSucesso() {
    this.mostrarSucesso.set(false);
  }

  abrirConfirmacaoDeletar(produto: Produto) {
    if (!this.isAdmin()) return;
    this.produtoParaDeletar = produto;
    this.mostrarConfirmacaoDeletar.set(true);
  }

  fecharConfirmacaoDeletar() {
    this.mostrarConfirmacaoDeletar.set(false);
    this.produtoParaDeletar = null;
  }

  async confirmarExclusao() {
    if (!this.isAdmin() || !this.produtoParaDeletar?.id) return;
    try {
      await this.cardapioService.remover(this.produtoParaDeletar.id);
      this.fecharConfirmacaoDeletar();
    } catch {
    }
  }

  async toggleAtivo(produto: Produto) {
    if (!produto.id) return;
    const novoStatus = !produto.ativo;
    try {
      await this.cardapioService.atualizar({ ...produto, ativo: novoStatus });
    } catch {
      produto.ativo = !novoStatus;
    }
  }

  criarProdutoPadrao(): Produto {
    return { 
      nome: 'Novo Prato Sushi', 
      descricao: 'Ingredientes selecionados e frescos', 
      preco: 29.90, 
      categoria: 'combos', 
      imagemUrl: 'assets/sem-foto.png', 
      ativo: true 
    } as any; 
  }
}