# Manual do Sistema de Pedidos

> Sistema web local para geração de orçamentos e pedidos de venda com envio por e-mail.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação](#instalação)
4. [Configuração de E-mail (SMTP)](#configuração-de-e-mail-smtp)
5. [Planilhas de Dados](#planilhas-de-dados)
6. [Iniciar e Parar o Sistema](#iniciar-e-parar-o-sistema)
7. [Usando o Sistema](#usando-o-sistema)
8. [Identidade Visual (Logotipo)](#identidade-visual-logotipo)
9. [Atualizar o Sistema](#atualizar-o-sistema)
10. [Solução de Problemas](#solução-de-problemas)
11. [Estrutura de Pastas](#estrutura-de-pastas)

---

## Visão Geral

O sistema roda **100% local** no computador, sem necessidade de internet para uso diário.  
Ele expõe uma página web acessível pelo navegador (`http://localhost:8787`) onde é possível:

- Carregar o catálogo de produtos (planilha Excel/CSV)
- Carregar a base de clientes (planilha Excel/CSV)
- Montar um carrinho de pedido com quantidades, descontos por item, IPI e Substituição Tributária
- Gerar **Orçamento** e **Pedido** em PDF
- Enviar os documentos por e-mail diretamente pelo sistema

---

## Pré-requisitos

| Requisito | Versão mínima | Observação |
|---|---|---|
| Windows | 10 / 11 | — |
| Node.js | 20 LTS | Instalado automaticamente pelo instalador se necessário |
| Winget | qualquer | Já presente no Windows 10/11 atualizado |

> O instalador cuida do Node.js automaticamente. Se o computador não tiver acesso à internet, instale o [Node.js LTS](https://nodejs.org) manualmente antes de rodar o instalador.

---

## Instalação

### Passo 1 — Copiar os arquivos do sistema

Copie a pasta com os arquivos do sistema para qualquer lugar (ex.: Área de Trabalho, pen drive).

### Passo 2 — Executar o instalador

Abra a pasta copiada, **clique com o botão direito** em `install-plataforma.bat` e escolha **"Executar como administrador"**.

> O `.bat` é o arquivo que o usuário executa. Ele chama o `install-plataforma.ps1` internamente — não é necessário abrir o `.ps1` diretamente.

O instalador irá:

1. Copiar os arquivos para `C:\Plataforma\Pedidos`
2. Instalar o Node.js (se necessário)
3. Instalar as dependências e gerar os builds
4. Criar as pastas de dados de produtos e clientes
5. Criar o arquivo de configuração `server\.env`
6. Criar uma pasta **`LubeferPedidos`** na Área de Trabalho com os atalhos:

| Atalho | Função |
|---|---|
| `Planilha de Produtos.lnk` | Abre a pasta onde colocar a planilha de produtos |
| `Planilha de Clientes.lnk` | Abre a pasta onde colocar a planilha de clientes |
| `Iniciar Plataforma.lnk` | Inicia o servidor local |
| `Parar Plataforma.lnk` | Encerra o servidor local |
| `Abrir Sistema.url` | Abre o sistema no navegador padrão |

### Passo 3 — Configurar o e-mail

Antes de iniciar, configure o arquivo `server\.env` com as credenciais do e-mail.  
Veja a seção [Configuração de E-mail](#configuração-de-e-mail-smtp) abaixo.

---

## Configuração de E-mail (SMTP)

Após a instalação, abra o arquivo `C:\Plataforma\Pedidos\server\.env` em qualquer editor de texto (Bloco de Notas, etc.) e preencha os campos:

```dotenv
# Porta do servidor (não alterar)
PORT=8787

# SMTP — configurações do servidor de e-mail
SMTP_HOST=email-ssl.com.br        # Host SMTP da Locaweb (ou outro provedor)
SMTP_PORT=465                     # Porta SSL
SMTP_SECURE=true                  # true para SSL, false para TLS/STARTTLS
SMTP_USER=seu-email@dominio.com   # Usuário de autenticação SMTP
SMTP_PASS=sua-senha-real          # Senha do e-mail
SMTP_FROM_EMAIL=vendas@dominio.com  # E-mail que aparecerá como remetente

# E-mail padrão para onde os pedidos são enviados
SMTP_DEFAULT_TO=vendas@dominio.com

# Cópia oculta para auditoria (opcional — deixe em branco para desativar)
SMTP_AUDIT_BCC=
```

> **Locaweb:** o host padrão para SSL é `email-ssl.com.br` na porta `465`.  
> Consulte o painel da Locaweb em **Hospedagem → E-mail → Configurações de cliente de e-mail** para confirmar os dados.

Salve o arquivo e inicie o sistema normalmente.

---

## Planilhas de Dados

### Planilha de Produtos

Coloque o arquivo (`.xlsx` ou `.csv`) na pasta:

```
C:\Plataforma\Pedidos\frontend\public\catalogo\
```

Use o atalho **`Planilha de Produtos`** na Área de Trabalho para abrir essa pasta diretamente.

**Colunas esperadas** (os nomes são detectados automaticamente):

| Dado | Nomes aceitos na coluna |
|---|---|
| Código | `Codigo`, `Cod`, `Ref`, `SKU`, `ID` |
| Nome / Descrição | `Nome`, `Descricao`, `Produto`, `Item` |
| Preço | `Preco`, `Valor`, `Price`, `Vlr Unit` |
| Estoque | `Estoque`, `Saldo`, `Qtd`, `Stock` |
| Unidade | `Unidade`, `UN`, `Unid` |
| Grupo | `Grupo`, `Categoria`, `Linha` |
| IPI % | `IPI`, `Aliq IPI`, `IPI %` |
| Subst. Tributária % | `Subst`, `Subs Trib`, `Substituição Tribut`, `ST %` |

> Colunas não reconhecidas podem ser mapeadas manualmente na tela de upload.

### Planilha de Clientes

Coloque o arquivo na pasta:

```
C:\Plataforma\Pedidos\frontend\public\clientes\
```

Use o atalho **`Planilha de Clientes`** na Área de Trabalho.

**Colunas esperadas:**

| Dado | Nomes aceitos |
|---|---|
| Razão Social | `Razao Social`, `Nome`, `Cliente` |
| CNPJ | `CNPJ`, `CPF/CNPJ` |
| E-mail | `Email`, `E-mail` |
| Telefone | `Telefone`, `Fone`, `Tel` |
| Endereço | `Endereco`, `Endereço`, `Logradouro` |

---

## Iniciar e Parar o Sistema

### Iniciar

Clique duas vezes no atalho **`Iniciar Plataforma`** na Área de Trabalho.  
O navegador abrirá automaticamente em `http://localhost:8787`.

Ou navegue até `C:\Plataforma\Pedidos\` e execute `start-plataforma.bat`.

### Acessar pelo navegador

Se o navegador não abrir automaticamente, acesse manualmente:

```
http://localhost:8787
```

Use o atalho **`Abrir Sistema.url`** na Área de Trabalho.

### Parar

Clique duas vezes em **`Parar Plataforma`** na Área de Trabalho.  
Ou execute `stop-plataforma.bat` na pasta do sistema.

---

## Usando o Sistema

O sistema é organizado em **4 etapas**:

### Etapa 1 — Carregar Planilha de Produtos

- Clique em **Carregar Planilha** e selecione o arquivo `.xlsx` ou `.csv`
- O sistema detecta as colunas automaticamente
- Confirme o mapeamento das colunas e clique em **Confirmar**
- Os produtos aparecerão no catálogo abaixo

### Etapa 2 — Selecionar Cliente

- Clique em **Selecionar Cliente** e escolha da lista
- Ou preencha os dados manualmente

### Etapa 3 — Montar o Carrinho

- Clique em **Adicionar** nos produtos do catálogo para incluí-los no pedido
- No carrinho é possível:
  - Ajustar a **quantidade** por item
  - Informar a **% de Subst. Tributária** por item (campo editável)
  - Ver o **IPI** informativo (lido direto da planilha, somente leitura)
  - Aplicar **desconto por item** (valor R$ por unidade ou %) clicando no ícone de etiqueta
  - Aplicar **desconto geral** no total do pedido
- O resumo financeiro exibe: Total dos Produtos / IPI Total / ST Total / Total c/ Impostos

### Etapa 4 — Finalizar

- Preencha condição de pagamento, prazo de entrega e observações
- Clique em **Gerar Orçamento** ou **Gerar Pedido**
- No modal que abre:
  - Confira todos os valores (incluindo IPI e ST por item)
  - Clique em **Imprimir** ou **Baixar PDF**
  - Clique em **Enviar por E-mail** para enviar diretamente ao cliente

#### Cálculo de impostos

| Imposto | Base de cálculo |
|---|---|
| IPI | Subtotal do item (após desconto) × alíquota IPI% |
| Subst. Tributária | (Subtotal + IPI do item) × alíquota ST% |

> O desconto aplicado por item é **por unidade** (desconto incondicional). Ex.: R$ 10,00 de desconto com 50 unidades = R$ 500,00 de desconto total.

---

## Identidade Visual (Logotipo)

Para usar o logotipo da empresa nos PDFs e e-mails, substitua o arquivo:

```
C:\Plataforma\Pedidos\frontend\public\branding\company-logo.png
```

- Formato: **PNG** com fundo transparente
- Tamanho recomendado: **300 × 100 px** (proporção 3:1)
- O nome do arquivo deve permanecer `company-logo.png`

---

## Atualizar o Sistema

Para atualizar quando houver uma nova versão:

1. Copie a nova pasta do sistema para o computador
2. Execute `install-plataforma.bat` da nova versão como administrador
3. O instalador sobrescreve os arquivos do sistema mas **preserva**:
   - `server\.env` (suas configurações de e-mail)
   - Planilhas em `frontend\public\catalogo\` e `frontend\public\clientes\`
   - Logotipo em `frontend\public\branding\`

> **Atenção:** se quiser instalar em outro caminho ou com outro nome, execute via PowerShell (neste caso sim, chame o `.ps1` diretamente):
> ```powershell
> powershell -ExecutionPolicy Bypass -File install-plataforma.ps1 -InstallPath "C:\MinhaPasta" -SystemName "MeuSistema"
> ```

---

## Solução de Problemas

### O sistema não abre no navegador

1. Verifique se o servidor foi iniciado (atalho **Iniciar Plataforma**)
2. Acesse manualmente: `http://localhost:8787`
3. Verifique se outra aplicação está usando a porta 8787:
   ```
   netstat -ano | findstr :8787
   ```
4. Se necessário, pare e inicie novamente

### E-mail não é enviado

1. Abra `C:\Plataforma\Pedidos\server\.env` e verifique as credenciais SMTP
2. Certifique-se de que o servidor de e-mail aceita conexões na porta configurada
3. Verifique o log em `C:\Plataforma\Pedidos\server\logs\email-sends.csv`
4. Confirme que o antivírus/firewall não está bloqueando conexões na porta 465

### Planilha não carrega ou colunas erradas

1. Certifique-se de que o arquivo é `.xlsx` ou `.csv` válido
2. Se as colunas não forem reconhecidas automaticamente, mapeie manualmente na tela de upload
3. Evite células mescladas na planilha e cabeçalhos com caracteres especiais

### Node.js não encontrado após instalação

1. Feche todos os terminais abertos
2. Abra um novo terminal e verifique: `node -v`
3. Se ainda não aparecer, reinicie o computador

### Erro "Build não encontrada"

Execute novamente o instalador (`install-plataforma.bat`) para regenerar os builds.

---

## Estrutura de Pastas

```
C:\Plataforma\Pedidos\
├── frontend\
│   ├── public\
│   │   ├── catalogo\          ← coloque aqui a planilha de produtos
│   │   ├── clientes\          ← coloque aqui a planilha de clientes
│   │   └── branding\
│   │       └── company-logo.png  ← logotipo da empresa
│   └── dist\                  ← build do frontend (gerado pelo instalador)
├── server\
│   ├── dist\                  ← build do backend (gerado pelo instalador)
│   ├── logs\
│   │   └── email-sends.csv    ← histórico de e-mails enviados
│   ├── .env                   ← configurações (SMTP, porta) — EDITAR ESTE
│   └── .env.example           ← modelo de configuração
├── start-plataforma.bat       ← iniciar o sistema
├── stop-plataforma.bat        ← parar o sistema
└── install-plataforma.bat     ← instalador
```

---

> Dúvidas ou problemas? Entre em contato com o responsável técnico do sistema.
