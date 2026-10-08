import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { Produto } from '../models/produto.model';
import { Bairro } from '../models/bairro.model';
import { ArmazenamentoDemoService } from './armazenamentoDemo.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CardapioService {
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);
  private armazenamentoService = inject(ArmazenamentoDemoService);

  obterStatusLoja(): Observable<any> {
    if (environment.modoDemonstracao) {
      return this.armazenamentoService.ouvirDocumento('config_loja', { aberta: true });
    }

    if (!isPlatformBrowser(this.platformId)) return of({ aberta: true });

    return new Observable((observer) => {
      const docRef = doc(this.firestore, 'config', 'loja');
      const pararDeOuvir = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          observer.next(docSnap.data());
        } else {
          observer.next({ aberta: true });
          setDoc(docRef, { aberta: true });
        }
      }, (erro) => {
        observer.error(erro);
      });

      return () => pararDeOuvir();
    });
  }

  async alternarStatusLoja(novoStatus: boolean) {
    if (environment.modoDemonstracao) {
      this.armazenamentoService.salvarObjeto('config_loja', { aberta: novoStatus });
      return;
    }

    const ref = doc(this.firestore, 'config', 'loja');
    try {
      await updateDoc(ref, { aberta: novoStatus });
    } catch {
      await setDoc(ref, { aberta: novoStatus }, { merge: true });
    }
  }

  obterBairros(): Observable<Bairro[]> {
    if (environment.modoDemonstracao) {
      return this.armazenamentoService.ouvirColecao<Bairro>('bairros');
    }

    if (!isPlatformBrowser(this.platformId)) return of([]);

    return new Observable((observer) => {
      const bairrosCol = collection(this.firestore, 'bairros');
      return onSnapshot(bairrosCol, (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Bairro[];
        
        lista.sort((a, b) => a.nome.localeCompare(b.nome));
        observer.next(lista);
      });
    });
  }

  adicionarBairro(bairro: any) {
    if (environment.modoDemonstracao) {
      return Promise.resolve(this.armazenamentoService.adicionarItem('bairros', bairro));
    }
    return addDoc(collection(this.firestore, 'bairros'), bairro);
  }

  removerBairro(id: string) {
    if (environment.modoDemonstracao) {
      this.armazenamentoService.removerItem('bairros', id);
      return Promise.resolve();
    }
    return deleteDoc(doc(this.firestore, `bairros/${id}`));
  }

  atualizarTaxaBairro(id: string, novaTaxa: number) {
    if (environment.modoDemonstracao) {
      this.armazenamentoService.atualizarItem('bairros', id, { taxa: novaTaxa });
      return Promise.resolve();
    }
    return updateDoc(doc(this.firestore, `bairros/${id}`), { taxa: novaTaxa });
  }

  obterProdutos(): Observable<Produto[]> {
    if (environment.modoDemonstracao) {
      return this.armazenamentoService.ouvirColecao<Produto>('produtos');
    }

    if (!isPlatformBrowser(this.platformId)) return of([]);

    return new Observable((observer) => {
      const produtosCol = collection(this.firestore, 'produtos');
      const pararDeOuvir = onSnapshot(produtosCol, (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((p: any) => p.ativo !== false) as Produto[];
        lista.sort((a, b) => a.nome.localeCompare(b.nome));
        observer.next(lista);
      });
      return () => pararDeOuvir();
    });
  }

  adicionar(p: Produto) {
    if (environment.modoDemonstracao) {
      return Promise.resolve(this.armazenamentoService.adicionarItem('produtos', p));
    }
    return addDoc(collection(this.firestore, 'produtos'), p); 
  }
  
  atualizar(p: Produto) {
    if (environment.modoDemonstracao) {
      this.armazenamentoService.atualizarItem('produtos', p.id || '', p);
      return Promise.resolve();
    }
    return updateDoc(doc(this.firestore, `produtos/${p.id}`), { ...p });
  }

  remover(id: string) {
    if (environment.modoDemonstracao) {
      this.armazenamentoService.removerItem('produtos', id);
      return Promise.resolve();
    }
    return deleteDoc(doc(this.firestore, `produtos/${id}`));
  }
}