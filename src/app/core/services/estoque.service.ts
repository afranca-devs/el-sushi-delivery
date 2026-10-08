import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, deleteDoc, getDocs, updateDoc, increment, serverTimestamp } from '@angular/fire/firestore';
import { Insumo } from '../models/insumo.model';
import { ArmazenamentoDemoService } from './armazenamentoDemo.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private firestore = inject(Firestore);
  private armazenamentoService = inject(ArmazenamentoDemoService);
  private colRef = collection(this.firestore, 'insumos');

  async obterInsumos(): Promise<Insumo[]> {
    if (environment.modoDemonstracao) {
      return this.armazenamentoService.obterLista<Insumo>('insumos');
    }
    const snapshot = await getDocs(this.colRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Insumo[];
  }

  async adicionar(insumo: Insumo) {
    if (environment.modoDemonstracao) {
      return this.armazenamentoService.adicionarItem('insumos', insumo);
    }
    return await addDoc(this.colRef, insumo);
  }

  async remover(id: string) {
    if (environment.modoDemonstracao) {
      this.armazenamentoService.removerItem('insumos', id);
      return;
    }
    const docRef = doc(this.firestore, `insumos/${id}`);
    return await deleteDoc(docRef);
  }

  async baixarEstoque(insumoId: string, nomeInsumo: string, quantidade: number, motivo: string) {
    if (environment.modoDemonstracao) {
      const insumos = this.armazenamentoService.obterLista<Insumo>('insumos');
      const insumo = insumos.find(i => i.id === insumoId);
      if (insumo) {
        insumo.quantidadeAtual -= quantidade;
        this.armazenamentoService.salvarLista('insumos', insumos);
      }
      this.armazenamentoService.adicionarItem('movimentacoes', {
        insumoId,
        nomeInsumo,
        quantidade: -quantidade,
        tipo: 'saida',
        motivo,
        data: new Date().toISOString()
      });
      return;
    }

    const docRef = doc(this.firestore, `insumos/${insumoId}`);
    await updateDoc(docRef, {
      quantidadeAtual: increment(-quantidade)
    });

    const movRef = collection(this.firestore, 'movimentacoes');
    await addDoc(movRef, {
      insumoId,
      nomeInsumo,
      quantidade: -quantidade,
      tipo: 'saida',
      motivo,
      data: serverTimestamp()
    });
  }

  async adicionarEstoque(insumoId: string, nomeInsumo: string, qtd: number) {
    if (environment.modoDemonstracao) {
      const insumos = this.armazenamentoService.obterLista<Insumo>('insumos');
      const insumo = insumos.find(i => i.id === insumoId);
      if (insumo) {
        insumo.quantidadeAtual += qtd;
        this.armazenamentoService.salvarLista('insumos', insumos);
      }
      this.armazenamentoService.adicionarItem('movimentacoes', {
        insumoId,
        nomeInsumo,
        quantidade: qtd,
        tipo: 'entrada',
        motivo: 'Reposição de Estoque (Compra)',
        data: new Date().toISOString()
      });
      return;
    }

    const docRef = doc(this.firestore, `insumos/${insumoId}`);
    await updateDoc(docRef, {
      quantidadeAtual: increment(qtd)
    });

    const movRef = collection(this.firestore, 'movimentacoes');
    await addDoc(movRef, {
      insumoId,
      nomeInsumo,
      quantidade: qtd,
      tipo: 'entrada',
      motivo: 'Reposição de Estoque (Compra)',
      data: serverTimestamp()
    });
  }
}