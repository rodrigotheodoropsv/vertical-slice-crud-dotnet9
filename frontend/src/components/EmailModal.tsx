import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Send as SendIcon,
  MailOutline as MailIcon,
  AttachFile as AttachIcon,
  PictureAsPdf as PdfIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import toast from 'react-hot-toast';

import type { BrandingConfig, Order, SmtpConfig } from '../types';
import { buildEmailBody, buildEmailHtml, buildEmailSubject } from '../utils/emailBuilder';
import OrderPDF from './OrderPDF';
import OrcamentoPDF from './OrcamentoPDF';

interface Props {
  order: Order;
  branding: BrandingConfig;
  smtpConfig: SmtpConfig;
  onConfigChange: (config: SmtpConfig) => void;
  onClose: () => void;
}

type TabValue = 'preview' | 'html' | 'config';
type AttachmentType = 'none' | 'pedido' | 'orcamento';

interface SendEmailRequest {
  to: string;
  cc?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  fromName?: string;
  metadata: {
    orderNumber: string;
    clientName: string;
    documentType: 'pedido' | 'orcamento' | 'none';
  };
  attachment?: {
    filename: string;
    mimeType: string;
    contentBase64: string;
  };
}

async function fetchLogoBase64(logoPath: string): Promise<string> {
  try {
    const resp = await fetch(`${window.location.origin}${logoPath}`);
    if (!resp.ok) return '';
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function EmailModal({ order, branding, smtpConfig: initialConfig, onConfigChange, onClose }: Props) {
  const [tab, setTab] = useState<TabValue>('preview');
  const [config, setConfig] = useState<SmtpConfig>(initialConfig);
  const [toEmail, setToEmail] = useState(initialConfig.salesEmail?.trim() || 'vendas1@lubefer.com.br');
  const [ccEmail, setCcEmail] = useState('');
  const [attachment, setAttachment] = useState<AttachmentType>('pedido');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [customMsgOpen, setCustomMsgOpen] = useState(false);

  const plainBody = buildEmailBody(order, config, customMessage);
  const htmlBody = buildEmailHtml(order, branding, config, customMessage);
  const subject = buildEmailSubject(order);
  const resolvedTo = toEmail || config.salesEmail || order.cliente.email;
  const resolvedCc = ccEmail.trim();

  async function generateAttachmentPdf(type: Exclude<AttachmentType, 'none'>): Promise<{ blob: Blob; filename: string } | null> {
    const logoUrl = await fetchLogoBase64(branding.logoPath);
    try {
      const element =
        type === 'pedido'
          ? <OrderPDF order={order} branding={branding} logoUrl={logoUrl} />
          : <OrcamentoPDF order={order} branding={branding} logoUrl={logoUrl} />;

      const blob = await pdf(element).toBlob();
      const filename =
        type === 'pedido'
          ? `Pedido-${order.numero}-${order.cliente.razaoSocial.replace(/\s+/g, '_')}.pdf`
          : `Orcamento-${order.numero}-${order.cliente.razaoSocial.replace(/\s+/g, '_')}.pdf`;

      return { blob, filename };
    } catch {
      toast.error('Erro ao gerar o PDF.');
      return null;
    }
  }

  async function handleSendLocalBackend() {
    if (!resolvedTo) {
      toast.error('Informe o e-mail destinatario.');
      return;
    }

    setSending(true);
    try {
      let attachmentPayload: SendEmailRequest['attachment'] | undefined;
      if (attachment !== 'none') {
        const generated = await generateAttachmentPdf(attachment);
        if (!generated) {
          setSending(false);
          return;
        }
        const dataUrl = await blobToDataUrl(generated.blob);
        attachmentPayload = {
          filename: generated.filename,
          mimeType: 'application/pdf',
          contentBase64: dataUrl,
        };
      }

      const payload: SendEmailRequest = {
        to: resolvedTo,
        cc: resolvedCc || undefined,
        subject,
        textBody: plainBody,
        htmlBody,
        fromName: config.fromName || order.vendedor,
        metadata: {
          orderNumber: order.numero,
          clientName: order.cliente.razaoSocial,
          documentType: attachment,
        },
        attachment: attachmentPayload,
      };

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao enviar e-mail no servidor local.');
      }

      toast.success(attachment === 'none' ? 'E-mail enviado com sucesso!' : 'E-mail enviado com PDF anexo!');
      onClose();
    } catch (err) {
      toast.error(`Falha ao enviar: ${(err as Error).message || 'Erro desconhecido'}`);
    } finally {
      setSending(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(tab === 'html' ? htmlBody : plainBody).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function setField(key: keyof SmtpConfig, value: string) {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    onConfigChange(updated);
  }

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <MailIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Template de E-mail</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <Box sx={{ px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="preview" label="Texto" />
          <Tab value="html" label="HTML" />
          <Tab value="config" label="Configuracoes" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2.2 }}>
        {tab !== 'config' && (
          <>
            <Stack spacing={1.25} sx={{ mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Para"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder={config.salesEmail || 'vendas1@lubefer.com.br'}
                helperText={
                  toEmail
                    ? 'Destinatario personalizado'
                    : config.salesEmail
                      ? `Padrao: departamento de vendas (${config.salesEmail})`
                      : 'Configure o e-mail de vendas na aba Configuracoes'
                }
              />
              <TextField
                fullWidth
                size="small"
                label="CC (copias, opcional)"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="ex.: gerente@lubefer.com.br; financeiro@lubefer.com.br"
                helperText="Para multiplos e-mails, use ponto e virgula (;)."
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <AttachIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Anexar PDF:
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={attachment}
                onChange={(_, v) => { if (v !== null) setAttachment(v as AttachmentType); }}
              >
                <ToggleButton value="none">Nenhum</ToggleButton>
                <ToggleButton value="pedido" sx={{ gap: 0.5 }}>
                  <PdfIcon fontSize="small" /> Pedido
                </ToggleButton>
                <ToggleButton value="orcamento" sx={{ gap: 0.5 }}>
                  <PdfIcon fontSize="small" /> Orcamento
                </ToggleButton>
              </ToggleButtonGroup>
              {attachment !== 'none' && (
                <Chip
                  size="small"
                  icon={<AttachIcon />}
                  label={`${attachment === 'pedido' ? 'Pedido' : 'Orcamento'} sera anexado ao enviar pelo servidor`}
                  color="info"
                  variant="outlined"
                />
              )}
            </Stack>

            <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
              <Typography variant="body2"><strong>Assunto:</strong> {subject}</Typography>
            </Alert>

            {/* Mensagem personalizada */}
            <Box sx={{ mb: 2, border: '1px solid', borderColor: customMessage ? 'primary.light' : 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setCustomMsgOpen(o => !o)}
                sx={{ px: 2, py: 1.2, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <EditIcon fontSize="small" color={customMessage ? 'primary' : 'action'} />
                  <Typography variant="body2" sx={{ fontWeight: customMessage ? 600 : 400, color: customMessage ? 'primary.main' : 'text.secondary' }}>
                    Mensagem personalizada
                  </Typography>
                  {customMessage ? (
                    <Chip size="small" label="Adicionada" color="primary" variant="filled" sx={{ height: 20, fontSize: 11 }} />
                  ) : (
                    <Typography variant="caption" color="text.disabled">(opcional)</Typography>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {customMsgOpen ? '▲' : '▼'}
                </Typography>
              </Stack>
              <Collapse in={customMsgOpen}>
                <Box sx={{ px: 2, pb: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                    Escreva sua mensagem. Ela <strong>substitui completamente</strong> o texto padrao do template.
                    Deixe em branco para usar o texto padrao.
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={7}
                    size="small"
                    placeholder="Ex.: Conforme combinado em nossa conversa de hoje, segue o pedido referente ao item discutido."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    inputProps={{ maxLength: 800 }}
                  />
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.75 }}>
                    <Typography variant="caption" color={customMessage.length > 750 ? 'error' : 'text.disabled'}>
                      {customMessage.length}/800 caracteres
                    </Typography>
                    {customMessage && (
                      <Button size="small" color="error" variant="text" onClick={() => setCustomMessage('')} sx={{ minWidth: 0, fontSize: 12 }}>
                        Limpar
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          </>
        )}

        {tab === 'preview' && (
          <Box
            component="pre"
            sx={{
              m: 0, p: 2, borderRadius: 2,
              border: '1px solid', borderColor: 'divider',
              bgcolor: 'grey.50', fontFamily: 'monospace',
              fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap',
            }}
          >
            {plainBody}
          </Box>
        )}

        {tab === 'html' && (
          <Box
            component="iframe"
            title="Email HTML preview"
            srcDoc={htmlBody}
            sx={{ width: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider', height: 460 }}
          />
        )}

        {tab === 'config' && (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              O envio automatico usa o <strong>servidor local (BFF Node)</strong> com SMTP da Locaweb.
              Nenhuma senha SMTP fica salva no navegador.
            </Alert>

            <Typography variant="subtitle2" color="text.secondary">Remetente / Assinatura</Typography>
            {([
              { key: 'fromName', label: 'Nome do Remetente', placeholder: 'Claudio Theodoro' },
              { key: 'fromCargo', label: 'Cargo', placeholder: 'Assistente Comercial' },
              { key: 'fromCelular', label: 'Celular', placeholder: '(11) 99619-9894' },
              { key: 'salesEmail', label: 'E-mail do Depto. de Vendas (destino padrao)', placeholder: 'vendas1@lubefer.com.br' },
            ] as { key: keyof SmtpConfig; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <TextField key={key} fullWidth size="small" label={label} placeholder={placeholder}
                value={config[key]} onChange={(e) => setField(key, e.target.value)} />
            ))}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Configuracao SMTP no Backend</Typography>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              As credenciais SMTP (host, usuario e senha) sao configuradas no backend via arquivo de ambiente.
              Se o envio falhar, verifique o arquivo de configuracao e o log de envios no servidor local.
            </Alert>
            <Typography variant="caption" color="text.secondary">
              As configuracoes sao salvas localmente no navegador (localStorage).
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Button
          onClick={handleCopy}
          variant="outlined"
          color="inherit"
          startIcon={copied ? <CheckIcon color="success" /> : <CopyIcon />}
        >
          {copied ? 'Copiado!' : 'Copiar texto'}
        </Button>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: { xs: 'left', sm: 'right' }, maxWidth: 360 }}>
            Suporte rapido via WhatsApp: (11) 93273-9111
          </Typography>
          <Button onClick={handleSendLocalBackend} variant="contained" startIcon={<SendIcon />} disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar Email'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
