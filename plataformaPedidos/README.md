# Plataforma de Pedidos de Vendas

Aplicação para geração de **pedidos** e **orçamentos** de vendas a partir de um catálogo em planilha (CSV ou XLSX), com cálculo automático de IPI, Substituição Tributária (ST) e descontos.

Composta por um frontend React e um backend BFF (Node.js/Express) responsável pelo envio de e-mails via SMTP.

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 📂 Upload de planilha | Suporta `.csv` e `.xlsx`. Mapeamento de colunas automático ou manual. |
| 🔍 Busca escalável | Filtro por código, nome ou categoria — se adapta aos cabeçalhos do arquivo. |
| 🛒 Carrinho de pedido | Adicione produtos, ajuste quantidades, desconto por item e desconto geral. |
| 🧾 IPI e Substituição Tributária | Cálculo automático por item com base nas colunas da planilha. |
| 💰 Descontos | Desconto por valor (R$/un) ou percentual, por item ou sobre o pedido inteiro. |
| 📋 Dados do cliente | Formulário com CNPJ, e-mail, endereço e telefone (com máscara automática). |
| 📄 PDF do Pedido | Geração de PDF A4 (retrato) com todos os valores detalhados. |
| 📄 PDF do Orçamento | Geração de PDF A4 (paisagem) com tabela expandida de IPI e ST por item. |
| ✉️ Envio de e-mail | Envio do orçamento/pedido via SMTP configurado no servidor (Nodemailer). |

## 🚀 Como instalar e executar

### Instalação (primeira vez)

Execute como Administrador:

```bat
install-plataforma.bat
```

O instalador copia os arquivos, instala o Node.js (se necessário), compila frontend e backend e cria atalhos na Área de Trabalho.

### Iniciar / Parar

```bat
start-plataforma.bat   # inicia o servidor e abre o navegador
stop-plataforma.bat    # encerra o servidor
```

O sistema fica disponível em `http://localhost:8787`.

### Desenvolvimento

```bash
# Backend (porta 8787)
cd server
npm install
npm run dev

# Frontend (porta 5173, proxy /api → 8787)
cd frontend
npm install
npm run dev
```

## 📁 Planilha de produtos

Coloque o arquivo em `frontend/public/catalogo/` e faça upload pela interface.

Colunas reconhecidas automaticamente (nomes flexíveis):

| Campo | Exemplos de cabeçalho |
|---|---|
| Código | `ID`, `Código`, `Cód.`, `SKU` |
| Nome | `Nome`, `Descrição`, `Produto` |
| Preço | `Preço`, `Preço Unitário`, `Vlr Unit` |
| IPI | `IPI`, `IPI %` |
| ST | `ST`, `ST %`, `Subst. Trib.` |
| Grupo | `Grupo`, `Categoria`, `GRUP` |
| Unidade | `Unidade`, `UN`, `Unid` |

## 🖼️ Logo da empresa

Coloque o arquivo em:

```
frontend/public/branding/company-logo.png
```

Usado automaticamente no cabeçalho da aplicação e nos PDFs de pedido e orçamento.

Para alterar o nome da empresa, edite `src/utils/branding.ts`.

## ✉️ Configuração de e-mail (SMTP)

Edite o arquivo `server/.env`:

```env
SMTP_HOST=smtp.seuservidor.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu@email.com.br
SMTP_PASS=sua_senha
SMTP_FROM=seu@email.com.br
```

O backend expõe o endpoint `POST /api/send-email` consumido pelo frontend.

## 🛠️ Stack

### Frontend

| Pacote | Uso |
|---|---|
| React 19 + TypeScript | Interface |
| Vite 8 | Build / Dev server |
| Material UI (MUI) 7 + Emotion | Componentes e tema |
| @react-pdf/renderer | Geração de PDF (Pedido e Orçamento) |
| ExcelJS | Leitura de `.xlsx` |
| Papa Parse | Leitura de `.csv` |
| @mui/icons-material | Ícones |
| react-hot-toast | Notificações |

### Backend (BFF)

| Pacote | Uso |
|---|---|
| Node.js + TypeScript | Runtime |
| Express 4 | Servidor HTTP |
| Nodemailer | Envio de e-mail via SMTP |
| dotenv | Configuração por variáveis de ambiente |
