import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { ArmazenamentoDemoService } from './armazenamentoDemo.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private firestore = inject(Firestore);
  private armazenamentoService = inject(ArmazenamentoDemoService);

  async obterRelatorioHoje() {
    if (environment.modoDemonstracao) {
      const historico = this.armazenamentoService.obterLista('historico');
      const pedidosFinalizados = historico.filter((p: any) => p.status === 'Concluido' || p.statusFinal === 'Concluido');

      const totalGeral = pedidosFinalizados.reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);
      const totalPix = pedidosFinalizados.filter((p: any) => p.pagamento === 'pix').reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);
      const totalDinheiro = pedidosFinalizados.filter((p: any) => p.pagamento === 'dinheiro').reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);
      const totalCartao = pedidosFinalizados.filter((p: any) => p.pagamento === 'cartao').reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);

      return {
        quantidadePedidos: pedidosFinalizados.length,
        totalGeral,
        totalPix,
        totalDinheiro,
        totalCartao
      };
    }

    const pedidosRef = collection(this.firestore, 'historico');
    const consulta = query(pedidosRef, where('status', '==', 'Concluido'));
    const snapshot = await getDocs(consulta);
    const pedidos = snapshot.docs.map(docSnapshot => docSnapshot.data());

    const totalGeral = pedidos.reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);
    const totalPix = pedidos.filter((p: any) => p.pagamento === 'pix').reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);
    const totalDinheiro = pedidos.filter((p: any) => p.pagamento === 'dinheiro').reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);
    const totalCartao = pedidos.filter((p: any) => p.pagamento === 'cartao').reduce((acumulado: number, p: any) => acumulado + (p.total || 0), 0);

    return {
      quantidadePedidos: pedidos.length,
      totalGeral,
      totalPix,
      totalDinheiro,
      totalCartao
    };
  }
}