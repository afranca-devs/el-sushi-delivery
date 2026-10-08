import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  dadosIniciaisProdutos,
  dadosIniciaisBairros,
  dadosIniciaisInsumos,
  dadosIniciaisMovimentacoes,
  dadosIniciaisPedidos,
  dadosIniciaisHistorico,
  dadosIniciaisConfigLoja
} from './dadosIniciaisDemo';

@Injectable({ providedIn: 'root' })
export class ArmazenamentoDemoService {
  private plataformaId = inject(PLATFORM_ID);

  private subjectsMap: { [chave: string]: BehaviorSubject<any> } = {};

  private prefixoChave = 'elsushi_demo_';

  constructor() {
    if (this.ehNavegador()) {
      this.inicializarDados();
    }
  }

  private ehNavegador(): boolean {
    return isPlatformBrowser(this.plataformaId);
  }

  private obterChaveCompleta(chave: string): string {
    return `${this.prefixoChave}${chave}`;
  }

  private inicializarDados(): void {
    const configuracaoSalva = localStorage.getItem(this.obterChaveCompleta('inicializado'));
    if (!configuracaoSalva) {
      this.restaurarDemonstracao();
    }
  }

  restaurarDemonstracao(): void {
    if (!this.ehNavegador()) return;

    localStorage.setItem(this.obterChaveCompleta('produtos'), JSON.stringify(dadosIniciaisProdutos));
    localStorage.setItem(this.obterChaveCompleta('bairros'), JSON.stringify(dadosIniciaisBairros));
    localStorage.setItem(this.obterChaveCompleta('insumos'), JSON.stringify(dadosIniciaisInsumos));
    localStorage.setItem(this.obterChaveCompleta('movimentacoes'), JSON.stringify(dadosIniciaisMovimentacoes));
    localStorage.setItem(this.obterChaveCompleta('pedidos'), JSON.stringify(dadosIniciaisPedidos));
    localStorage.setItem(this.obterChaveCompleta('historico'), JSON.stringify(dadosIniciaisHistorico));
    localStorage.setItem(this.obterChaveCompleta('config_loja'), JSON.stringify(dadosIniciaisConfigLoja));
    localStorage.setItem(this.obterChaveCompleta('clientes'), JSON.stringify({}));
    localStorage.setItem(this.obterChaveCompleta('inicializado'), 'true');

    Object.keys(this.subjectsMap).forEach(chave => {
      this.notificarMudanca(chave);
    });
  }

  ouvirColecao<T = any>(colecao: string): Observable<T[]> {
    if (!this.subjectsMap[colecao]) {
      const dadosIniciais = this.obterLista<T>(colecao);
      this.subjectsMap[colecao] = new BehaviorSubject<T[]>(dadosIniciais);
    }
    return this.subjectsMap[colecao].asObservable();
  }

  ouvirDocumento<T = any>(colecao: string, padrao: T): Observable<T> {
    const chave = `doc_${colecao}`;
    if (!this.subjectsMap[chave]) {
      const dadosIniciais = this.obterObjeto<T>(colecao, padrao);
      this.subjectsMap[chave] = new BehaviorSubject<T>(dadosIniciais);
    }
    return this.subjectsMap[chave].asObservable();
  }

  private notificarMudanca(colecao: string): void {
    if (this.subjectsMap[colecao]) {
      this.subjectsMap[colecao].next(this.obterLista(colecao));
    }
    const chaveDoc = `doc_${colecao}`;
    if (this.subjectsMap[chaveDoc]) {
      this.subjectsMap[chaveDoc].next(this.obterObjeto(colecao, {}));
    }
  }

  obterLista<T = any>(colecao: string): T[] {
    if (!this.ehNavegador()) return [];
    const item = localStorage.getItem(this.obterChaveCompleta(colecao));
    return item ? JSON.parse(item) : [];
  }

  salvarLista<T = any>(colecao: string, lista: T[]): void {
    if (!this.ehNavegador()) return;
    localStorage.setItem(this.obterChaveCompleta(colecao), JSON.stringify(lista));
    this.notificarMudanca(colecao);
  }

  adicionarItem(colecao: string, item: any): string {
    const lista = this.obterLista(colecao);
    const novoId = item.id || `demo_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const novoItem = { ...item, id: novoId };
    lista.push(novoItem);
    this.salvarLista(colecao, lista);
    return novoId;
  }

  atualizarItem(colecao: string, id: string, dadosAtualizados: any): void {
    const lista = this.obterLista(colecao);
    const indice = lista.findIndex(i => i.id === id);
    if (indice !== -1) {
      lista[indice] = { ...lista[indice], ...dadosAtualizados };
      this.salvarLista(colecao, lista);
    }
  }

  removerItem(colecao: string, id: string): void {
    const lista = this.obterLista(colecao);
    const novaLista = lista.filter(i => i.id !== id);
    this.salvarLista(colecao, novaLista);
  }

  obterObjeto<T = any>(chave: string, padrao: T): T {
    if (!this.ehNavegador()) return padrao;
    const item = localStorage.getItem(this.obterChaveCompleta(chave));
    return item ? JSON.parse(item) : padrao;
  }

  salvarObjeto<T = any>(chave: string, objeto: T): void {
    if (!this.ehNavegador()) return;
    localStorage.setItem(this.obterChaveCompleta(chave), JSON.stringify(objeto));
    this.notificarMudanca(chave);
  }
}
