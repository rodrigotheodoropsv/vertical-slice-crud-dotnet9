# Frontend — Emissão de Pedido de Vendas

Aplicação **100% frontend** em React + TypeScript (Vite) para geração de pedidos de vendas a partir de um catálogo em planilha (CSV ou XLSX).

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 📂 Upload de planilha | Suporta `.csv` e `.xlsx`. Mapeamento de colunas automático ou manual. |
| 🔍 Busca escalável | Filtro por código, nome ou categoria — se adapta aos cabeçalhos do arquivo. |
| 🛒 Carrinho de pedido | Adicione produtos, ajuste quantidades, visualize subtotais em tempo real. |
| 📋 Dados do cliente | Formulário com CNPJ, e-mail, endereço e telefone (com máscara automática). |
| 📄 Nota do Pedido | Visualização formatada e impressão / exportação para PDF. |
| ✉️ Template de e-mail | Geração automática em texto e HTML. Envio via **EmailJS** ou cliente de e-mail padrão. |
| 💾 Sem backend | Toda a lógica roda no navegador. Configurações SMTP salvas em `localStorage`. |

## 🚀 Como executar

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## 📁 Planilha de exemplo

O arquivo `public/produtos_catalogo.csv` simula um catálogo real de uma distribuidora de TI com 30 produtos nas categorias: Informática, Periféricos, Componentes, Armazenamento, Redes, Áudio, Impressão, etc.

Campos do catálogo de exemplo:

| Campo | Descrição |
|---|---|
| ID | Código interno do produto |
| Nome | Nome / descrição comercial |
| Categoria | Grupo de produtos |
| Unidade | UN, Resma, Licença… |
| Preço Unitário | Valor em R$ |
| Estoque | Quantidade disponível |
| Fabricante | Marca do produto |
| NCM | Código fiscal |
| Peso (kg) | Para cálculo de frete |
| Descrição | Detalhes técnicos |

> Você pode usar sua própria planilha — basta fazer upload e mapear as colunas nas telas de configuração.

## 🖼️ Logo personalizada da empresa

Você pode colocar o logo da sua empresa em:

- `public/branding/company-logo.png`

Esse arquivo é usado automaticamente em:

- Header da aplicação
- Nota do pedido (impressão/PDF)
- Template HTML de e-mail

Se quiser alterar nome da empresa ou caminho do logo padrão, ajuste:

- `src/utils/branding.ts`

## ✉️ Configuração de envio de e-mail

O envio utiliza o [EmailJS](https://www.emailjs.com) (gratuito para até 200 e-mails/mês):

1. Crie uma conta em emailjs.com
2. Conecte seu provedor de e-mail (Gmail, Outlook, etc.)
3. Crie um template com as variáveis: `to_email`, `from_name`, `subject`, `message`, `message_html`, `order_number`, `client_name`
4. Preencha **Service ID**, **Template ID** e **Public Key** no painel de configurações dentro da tela de e-mail

Como alternativa, clique em **"Abrir no cliente de e-mail"** para compor a mensagem no seu app de e-mail padrão.

## 🛠️ Stack

| Pacote | Uso |
|---|---|
| React 19 + TypeScript | Interface |
| Vite 8 | Build / Dev server |
| Material UI (MUI) 7 + Emotion | Componentes de interface e tema |
| ExcelJS | Leitura de `.xlsx` |
| Papa Parse | Leitura de `.csv` |
| @emailjs/browser | Envio de e-mail |
| @mui/icons-material | Ícones |
| react-hot-toast | Notificações |
