import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImpressaoService {

  formatarTextoComanda(identificador: string, nomeCliente: string, formaPagamento: string, itens: any[], observacao: string, valorTotal: number): string {
    const identificadorLimpo = identificador;
    const clienteLimpo = this.removerAcentos(nomeCliente);
    const pagamentoLimpo = this.removerAcentos(formaPagamento || 'A Pagar');

    let textoComanda = `================================\n`;
    textoComanda += `      EL SUSHI - ${identificadorLimpo}\n`;
    textoComanda += `================================\n`;
    textoComanda += `CLIENTE: ${clienteLimpo}\n`;
    textoComanda += `PAG: ${pagamentoLimpo}\n`;
    textoComanda += `--------------------------------\n`;

    itens.forEach(item => {
      const nomeItem = this.removerAcentos(item.nome || item.produto?.nome || 'Item');
      textoComanda += `${item.quantidade}x ${nomeItem}\n`;
    });

    textoComanda += `--------------------------------\n`;

    if (observacao && observacao.trim() !== '') {
      const observacaoLimpa = this.removerAcentos(observacao);
      textoComanda += `OBS: ${observacaoLimpa}\n`;
      textoComanda += `--------------------------------\n`;
    }

    textoComanda += `TOTAL: R$ ${valorTotal?.toFixed(2)}\n`;
    textoComanda += `================================\n\n\n`;

    return textoComanda;
  }

  imprimirComanda(textoComanda: string): void {
    try {
      const socket = new WebSocket('ws://127.0.0.1:40213/');

      socket.onopen = () => {
        socket.send(textoComanda);
        socket.close();
      };

      socket.onerror = () => {
        this.enviarViaDeepLink(textoComanda);
      };
    } catch {
      this.enviarViaDeepLink(textoComanda);
    }
  }

  enviarViaDeepLink(textoComanda: string): void {
    const textoCodificado = encodeURIComponent(textoComanda);
    window.location.href = `rawbt:${textoCodificado}`;
  }

  removerAcentos(texto: string): string {
    if (!texto) return '';
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
