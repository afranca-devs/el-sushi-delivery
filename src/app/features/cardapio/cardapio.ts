import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardapioService } from '../../core/services/cardapio.service';
import { CarrinhoService } from '../../core/services/carrinho.service';
import { Produto } from '../../core/models/produto.model';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cardapio.html',
  styleUrl: './cardapio.scss'
})
export class CardapioComponent implements OnInit {
  private cardapioService = inject(CardapioService);
  public carrinhoService = inject(CarrinhoService);
  private router = inject(Router);

  produtos = signal<Produto[]>([]);
  
  categorias = signal<string[]>([
    'Todos', 
    'Combos',
    'Hot Crocante', 
    'Temakis', 
    'Yakisoba', 
    'Harumaki',
    'Joe Joe', 
    'Bebidas',
    'Cervejas'
  ]);

  categoriaSelecionada = signal<string>('Todos'); 
  carregando = signal(true);
  lojaAberta = signal(true); 
  mostrarAvisoFechado = signal(true);

  modalProdutoAberto = false;
  produtoSelecionado: any = null;

  pegarEmoji(categoria: string): string {
    const mapaEmojis: Record<string, string> = {
      'Todos': '🌟',
      'Combos': '🍱',
      'Hot Crocante': '🔥',
      'Temakis': '🌯',
      'Yakisoba': '🍜',
      'Harumaki': '🥟',
      'Joe Joe': '🍣',
      'Bebidas': '🥤',
      'Cervejas': '🍺'
    };
    return mapaEmojis[categoria] || '🍽️';
  }

  produtosFiltrados = computed(() => {
    const cat = this.categoriaSelecionada();
    const listaAtiva = this.produtos().filter(p => p.ativo !== false);

    if (cat === 'Todos') return listaAtiva;

    return listaAtiva.filter(p => {
      const catProd = p.categoria ? p.categoria.toLowerCase() : '';

      if (cat === 'Bebidas') {
        return catProd.includes('refrigerante') || 
               catProd.includes('guaravita') || 
               catProd.includes('suco') || 
               catProd.includes('água') || 
               catProd.includes('bebida');
      }

      if (cat === 'Cervejas') {
        return catProd.includes('cerveja') || catProd.includes('long neck');
      }

      if (cat === 'Combos') {
        return catProd.includes('combo') || 
               catProd.includes('combinado') || 
               catProd.includes('box');
      }

      return catProd.includes(cat.toLowerCase()) || cat.toLowerCase().includes(catProd);
    });
  });

  ngOnInit() {
    this.cardapioService.obterProdutos().subscribe({
      next: (lista) => {
        this.produtos.set(lista);
        this.carregando.set(false);
      },
      error: (erro) => {
        console.error('Erro ao carregar', erro);
        this.carregando.set(false);
      }
    });

    this.cardapioService.obterStatusLoja().subscribe((dados: any) => {
      this.lojaAberta.set(dados ? dados.aberta : true);
      if (dados && !dados.aberta) this.mostrarAvisoFechado.set(true);
    });
  }

  filtrar(categoria: string) {
    this.categoriaSelecionada.set(categoria);
  }

  verDetalhes(produto: Produto) {
    this.produtoSelecionado = produto;
    this.modalProdutoAberto = true;
  }

  fecharModal() {
    this.modalProdutoAberto = false;
    this.produtoSelecionado = null;
  }

  adicionarAoCarrinho(produto: Produto, event?: Event) {
    if (event) event.stopPropagation();

    if (!this.lojaAberta()) {
      this.mostrarAvisoFechado.set(true);
      return;
    }

    this.carrinhoService.adicionar(produto);
    if (navigator.vibrate) navigator.vibrate(50);
    
    if (this.modalProdutoAberto) this.fecharModal();
  }

  irParaCarrinho() {
    if (!this.lojaAberta()) {
      this.mostrarAvisoFechado.set(true);
      return;
    }
    this.router.navigate(['/carrinho']);
  }

  fecharAvisoTemporario() {
    this.mostrarAvisoFechado.set(false);
  }
}