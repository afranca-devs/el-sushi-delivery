import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from '@angular/fire/firestore';
import { ModalBaseComponent } from '../../components/modal-base/modal-base';
import { ModalConfirmacaoComponent } from '../../components/modal-confirmacao/modal-confirmacao';

@Component({
  selector: 'app-admin-nota',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalBaseComponent, ModalConfirmacaoComponent],
  templateUrl: './admin-nota.html',
  styleUrl: './admin-nota.scss'
})
export class AdminNotaComponent implements OnInit {
  private firestore = inject(Firestore);

  notas = signal<any[]>([]);
  
  exibirForm = signal(false);
  exibirConfirmacao = signal(false);
  
  novaNotaValor: number | null = null;
  notaParaExcluirId = signal<string | null>(null);
  notaValorParaExcluir = signal<number>(0);

  itemTempNome = '';
  itemTempQtd = '';
  listaItens = signal<string[]>([]);

  ngOnInit() {
    this.carregarNotas();
  }

  carregarNotas() {
    const ref = collection(this.firestore, 'despesas');
    const q = query(ref, orderBy('data', 'desc'));
    onSnapshot(q, (snap) => {
      this.notas.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }

  adicionarItemNaLista() {
    if (!this.itemTempNome) return;

    let itemTexto = this.itemTempNome;
    if (this.itemTempQtd) {
      itemTexto += ` (${this.itemTempQtd})`;
    }

    this.listaItens.update(lista => [...lista, itemTexto]);
    
    this.itemTempNome = '';
    this.itemTempQtd = '';
    
    const el = document.getElementById('inputNomeItem');
    if (el) el.focus();
  }

  removerItemDaLista(index: number) {
    this.listaItens.update(lista => lista.filter((_, i) => i !== index));
  }

  async salvarNota() {
    if (this.listaItens().length === 0 || !this.novaNotaValor) {
        if(this.listaItens().length === 0) alert("Adicione pelo menos um item na lista.");
        return;
    }
    
    try {
      const descricaoFinal = this.listaItens().join(', ');

      await addDoc(collection(this.firestore, 'despesas'), {
        descricao: descricaoFinal,
        valor: Number(this.novaNotaValor),
        data: new Date()
      });
      this.fecharModalCadastro();
    } catch (e) {
      console.error("Erro ao salvar nota:", e);
    }
  }

  abrirConfirmacaoExclusao(id: string) {
    const nota = this.notas().find(n => n.id === id);
    if (nota) {
      this.notaParaExcluirId.set(id);
      this.notaValorParaExcluir.set(nota.valor);
      this.exibirConfirmacao.set(true);
    }
  }

  async confirmarExclusao() {
    const id = this.notaParaExcluirId();
    if (id) {
      await deleteDoc(doc(this.firestore, 'despesas', id));
    }
    this.fecharConfirmacao();
  }

  fecharConfirmacao() {
    this.exibirConfirmacao.set(false);
    this.notaParaExcluirId.set(null);
  }

  fecharModalCadastro() {
    this.exibirForm.set(false);
    this.novaNotaValor = null;
    this.listaItens.set([]); 
    this.itemTempNome = '';
    this.itemTempQtd = '';
  }
}