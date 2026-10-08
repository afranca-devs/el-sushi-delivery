import { Injectable, signal, computed, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Produto } from '../models/produto.model';
import { EstoqueService } from './estoque.service';
import { ArmazenamentoDemoService } from './armazenamentoDemo.service';
import { environment } from '../../../environments/environment';

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private estoqueService = inject(EstoqueService);
  private armazenamentoService = inject(ArmazenamentoDemoService);
  private firestore = inject(Firestore);

  itens = signal<ItemCarrinho[]>([]);

  valorTotal = computed(() =>
    this.itens().reduce((total, item) => total + (item.produto.preco * item.quantidade), 0)
  );

  quantidadeTotal = computed(() =>
    this.itens().reduce((qtd, item) => qtd + item.quantidade, 0)
  );

  adicionar(produto: Produto) {
    this.itens.update(listaAtual => {
      const indice = listaAtual.findIndex(item => item.produto.id === produto.id);

      if (indice !== -1) {
        const novaLista = [...listaAtual];
        novaLista[indice] = { ...novaLista[indice], quantidade: novaLista[indice].quantidade + 1 };
        return novaLista;
      }
      return [...listaAtual, { produto, quantidade: 1 }];
    });
  }

  remover(produtoId: string) {
    this.itens.update(listaAtual =>
      listaAtual.filter(item => item.produto.id !== produtoId)
    );
  }

  limpar() {
    this.itens.set([]);
  }

  async finalizarPedido(pedido: any) {
    try {
      if (environment.modoDemonstracao) {
        const pedidoDemonstracao = {
          ...pedido,
          dataPedido: new Date().toISOString(),
          status: 'pendente'
        };
        this.armazenamentoService.adicionarItem('pedidos', pedidoDemonstracao);
        await this.darBaixaNoEstoque(pedido);
        this.limpar();
        return;
      }

      const pedidoParaSalvar = {
        ...pedido,
        dataPedido: serverTimestamp(),
        status: 'pendente'
      };

      await addDoc(collection(this.firestore, 'pedidos'), pedidoParaSalvar);
      await this.darBaixaNoEstoque(pedido);
      this.limpar();
    } catch {
    }
  }

  async darBaixaNoEstoque(pedido: any) {
    for (const item of pedido.itens) {
      if (item.produto?.ingredientes && item.produto.ingredientes.length > 0) {
        for (const ing of item.produto.ingredientes) {
          const quantidadeTotalADescontar = ing.quantidadeNecessaria * item.quantidade;
          await this.estoqueService.baixarEstoque(
            ing.insumoId,
            ing.nome,
            quantidadeTotalADescontar,
            `Venda Pedido #${pedido.numero || 'Web'}`
          );
        }
      }
    }
  }
}