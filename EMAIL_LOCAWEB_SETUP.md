# Configuracao de Envio de E-mail (Locaweb + BFF Node)

Este projeto usa um backend local em Node para enviar e-mails via SMTP da Locaweb.

## 0. Instalacao automatica da maquina

Para preparar a maquina do usuario (Node + dependencias + builds):
1. Execute `install-plataforma.bat` (1 clique).
2. O script chama `install-plataforma.ps1` e faz:
	1. instalacao do Node LTS via winget (se necessario)
	2. `npm install` no frontend e backend
	3. build do frontend e backend
	4. criacao de `server/.env` (se nao existir)

Depois da instalacao:
1. Ajuste o arquivo `server/.env` com SMTP.
2. Rode `start-plataforma.bat`.

## 1. Onde configurar

1. Copie o arquivo `server/.env.example` para `server/.env`.
2. Preencha as variaveis SMTP no `server/.env`.

## 2. Quais dados voce precisa da Locaweb

Voce encontra essas informacoes no painel da Locaweb:
1. Acesse o painel de e-mail da Locaweb.
2. Abra a conta de e-mail que fara os envios (ex.: `vendas1@...`).
3. Procure por: SMTP / Configuracoes de cliente / Servidor de saida.

Campos necessarios:
1. `SMTP_HOST`: normalmente `email-ssl.com.br`
2. `SMTP_PORT`: normalmente `465` (SSL)
3. `SMTP_SECURE`: `true` para porta 465
4. `SMTP_USER`: e-mail completo da conta
5. `SMTP_PASS`: senha da conta de e-mail
6. `SMTP_FROM_EMAIL`: e-mail remetente (ex.: `vendas1@lubefer.com.br`)

## 3. Exemplo de arquivo .env

### 3.1 Modo simples (senha no .env)

```env
PORT=8787
ALLOWED_ORIGIN=http://localhost:5173

SMTP_HOST=email-ssl.com.br
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=vendas1@lubefer.com.br
SMTP_PASS=SUA_SENHA_AQUI
SMTP_FROM_EMAIL=vendas1@lubefer.com.br

SMTP_DEFAULT_TO=vendas1@lubefer.com.br
SMTP_AUDIT_BCC=

LOG_CSV_PATH=logs/email-sends.csv
```

### 3.2 Modo recomendado (senha no SO)

Neste modo, o `SMTP_PASS` nao fica salvo em arquivo texto.

```env
PORT=8787
ALLOWED_ORIGIN=http://localhost:5173

SMTP_HOST=email-ssl.com.br
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=vendas1@lubefer.com.br
SMTP_FROM_EMAIL=vendas1@lubefer.com.br

SMTP_DEFAULT_TO=vendas1@lubefer.com.br
SMTP_AUDIT_BCC=

LOG_CSV_PATH=logs/email-sends.csv
```

## 4. Modelo seguro na maquina local

Recomendado:
1. Nunca commitar `server/.env` no git.
2. Dar permissao de leitura do arquivo `.env` apenas para o usuario local.
3. Se quiser maior seguranca, manter `SMTP_PASS` em variavel de ambiente do Windows e remover do `.env`.

### 4.1 Configurar senha no SO (Windows)

Opcao mais segura para usuario final:
1. Deixar `SMTP_PASS` vazio no arquivo `server/.env`.
2. Definir a senha no Windows (variavel de ambiente do usuario).
3. Reiniciar o terminal antes de subir a plataforma.

Opcao A - PowerShell (usuario atual):

```powershell
setx SMTP_PASS "SUA_SENHA_AQUI"
```

Opcao B - Prompt de Comando (CMD, usuario atual):

```cmd
setx SMTP_PASS "SUA_SENHA_AQUI"
```

Opcao C - Interface grafica do Windows:
1. Abra: `Win + R` -> `SystemPropertiesAdvanced`
2. Clique em `Variaveis de Ambiente...`
3. Em `Variaveis de usuario`, clique em `Novo...`
4. Nome: `SMTP_PASS`
5. Valor: sua senha
6. Confirme em `OK`

Depois, remova a linha `SMTP_PASS` do `.env` (ou deixe sem valor) para evitar senha em texto puro.

Para conferir se a variavel foi gravada:

```powershell
[Environment]::GetEnvironmentVariable("SMTP_PASS", "User")
```

Para conferir no CMD:

```cmd
echo %SMTP_PASS%
```

Importante:
1. `setx` vale para novas janelas de terminal.
2. Feche e abra novamente o terminal antes de usar `start-plataforma.bat`.
3. Se o servidor ja estiver rodando, reinicie para ele ler a nova variavel.

## 5. Logs de envio

Todos os envios ficam em:
- `server/logs/email-sends.csv`

Campos registrados:
1. timestamp
2. status (SUCCESS/ERROR)
3. to
4. cc
5. bcc
6. subject
7. documentType (pedido/orcamento/none)
8. orderNumber
9. clientName
10. messageId
11. error

Isso ajuda a auditar e diagnosticar problemas de envio.

## 5.1 Comportamento de resiliencia e copia

1. O backend faz ate **3 tentativas** de envio para erro temporario SMTP (4xx), com **10 segundos** entre tentativas.
2. O tempo maximo de espera por retries fica em torno de 30 segundos (sem contar o tempo de processamento SMTP de cada tentativa).
3. Todo envio inclui copia oculta automatica (BCC) para o proprio remetente configurado em `SMTP_FROM_EMAIL`.
4. Se quiser adicionar outra caixa de auditoria, use `SMTP_AUDIT_BCC`.

## 6. Inicializacao da plataforma

Use o script na raiz:
- `start-plataforma.bat`

Ele:
1. instala dependencias se necessario
2. gera build do frontend
3. inicia o backend em background (sem abrir janela de prompt)
4. abre o navegador em `http://localhost:8787`

## 7. Como parar a plataforma

Use o script na raiz:
- `stop-plataforma.bat`

Ele encerra automaticamente processos nas portas:
1. `8787` (backend BFF)
2. `5173` (frontend em modo dev, se estiver aberto)
