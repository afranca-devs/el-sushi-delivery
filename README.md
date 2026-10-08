# 🍣 El Sushi — Sistema Completo de Delivery, Atendimento e Gestão

Sistema web completo para gestão e operação de delivery e salão de restaurante japonês, desenvolvido com **Angular 21**, **Signals**, arquitetura reativa e integração de hardware para automação de cozinha e entrega.

---

## 🌟 Destaques e Funcionalidades

- **Cardápio Interativo:** Filtro por categorias (Combos, Temakis, Hot Rolls, Bebidas), visualização de ingredientes e adição dinâmica ao carrinho.
- **Carrinho & Checkout:** Cálculo dinâmico de taxa de entrega por bairro, opção de retirada no balcão e integração com pagamento PIX.
- **Painel de Pedidos (Kanban em Tempo Real):** Acompanhamento visual dos pedidos (Pendente ➔ Em Preparação ➔ Aguardando Entrega/Em Rota).
- **Modo Mesas & Comandas:** Gestão de comandas presenciais para consumo no local e fechamento de conta.
- **Controle de Estoque & Ficha Técnica:** Baixa automática de insumos (salmão, arroz shari, nori, cream cheese) a cada venda realizada.
- **Integração de Hardware:** Impressão de comandas térmicas via WebSocket local e Deep Link RawBT.
- **Notificações via WhatsApp:** Envio automatizado de mensagens de status do pedido para o cliente.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** Angular 21 (Standalone Components & Signals)
- **Controle de Fluxo:** Nova sintaxe de templates Angular (`@if`, `@for`)
- **Estilização:** SCSS modular e responsivo
- **Persistência & Demonstração:** Sandbox reativo local via LocalStorage com restauração instantânea
- **Hospedagem & Deploy:** Vercel SPA (Roteamento configurado)

---

## 🚀 Como Executar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/afranca-devs/el-sushi-delivery.git
   cd el-sushi-delivery
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

4. Acesse no navegador: `http://localhost:4200`

---

## 👤 Autor

Desenvolvido por **Alexandre França**  
- **GitHub:** [@afranca-devs](https://github.com/afranca-devs)
- **Website:** [afranca-devs.com.br](https://afranca-devs.com.br)
