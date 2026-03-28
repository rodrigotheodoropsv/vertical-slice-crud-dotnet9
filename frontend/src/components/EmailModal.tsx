import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  OpenInNew as OpenIcon,
  Send as SendIcon,
  MailOutline as MailIcon,
} from '@mui/icons-material';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';

import type { BrandingConfig, Order, SmtpConfig } from '../types';
import { buildEmailBody, buildEmailHtml } from '../utils/emailBuilder';

interface Props {
  order: Order;
  branding: BrandingConfig;
  smtpConfig: SmtpConfig;
  onConfigChange: (config: SmtpConfig) => void;
  onClose: () => void;
}

type TabValue = 'preview' | 'html' | 'config';

export default function EmailModal({ order, branding, smtpConfig: initialConfig, onConfigChange, onClose }: Props) {
  const [tab, setTab] = useState<TabValue>('preview');
  const [config, setConfig] = useState<SmtpConfig>(initialConfig);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const plainBody = buildEmailBody(order);
  const htmlBody = buildEmailHtml(order, branding);
  const subject = `Pedido de Vendas No ${order.numero} - ${order.cliente.razaoSocial}`;

  async function handleSendEmailJs() {
    if (!config.serviceId || !config.templateId || !config.publicKey) {
      toast.error('Preencha as configuracoes do EmailJS antes de enviar.');
      setTab('config');
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        config.serviceId,
        config.templateId,
        {
          to_email: config.toEmail || order.cliente.email,
          from_name: config.fromName || order.vendedor,
          subject,
          message: plainBody,
          message_html: htmlBody,
          order_number: order.numero,
          client_name: order.cliente.razaoSocial,
        },
        { publicKey: config.publicKey },
      );
      toast.success('E-mail enviado com sucesso!');
      onClose();
    } catch (err) {
      toast.error(`Falha ao enviar: ${(err as { text?: string }).text ?? 'Erro desconhecido'}`);
    } finally {
      setSending(false);
    }
  }

  function handleMailto() {
    const body = encodeURIComponent(plainBody);
    const subjectEnc = encodeURIComponent(subject);
    const to = config.toEmail || order.cliente.email;
    window.open(`mailto:${to}?subject=${subjectEnc}&body=${body}`, '_blank');
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
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2"><strong>Para:</strong> {config.toEmail || order.cliente.email || '—'}</Typography>
            <Typography variant="body2"><strong>Assunto:</strong> {subject}</Typography>
          </Alert>
        )}

        {tab === 'preview' && (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
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
          <Stack spacing={1.5}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              O envio usa o EmailJS. Configure seu servico e copie as chaves abaixo.
              <Link href="https://www.emailjs.com" target="_blank" rel="noreferrer" sx={{ ml: 0.5 }}>
                Abrir EmailJS
              </Link>
            </Alert>

            {[
              { key: 'serviceId' as keyof SmtpConfig, label: 'Service ID', placeholder: 'service_xxxxxxx' },
              { key: 'templateId' as keyof SmtpConfig, label: 'Template ID', placeholder: 'template_xxxxxxx' },
              { key: 'publicKey' as keyof SmtpConfig, label: 'Public Key', placeholder: 'your_public_key' },
              { key: 'fromName' as keyof SmtpConfig, label: 'Nome do Remetente', placeholder: 'Equipe Comercial' },
              { key: 'toEmail' as keyof SmtpConfig, label: 'Destinatario (padrao)', placeholder: order.cliente.email || 'cliente@empresa.com' },
            ].map(({ key, label, placeholder }) => (
              <TextField
                key={key}
                fullWidth
                label={label}
                placeholder={placeholder}
                value={config[key]}
                onChange={(e) => setField(key, e.target.value)}
              />
            ))}

            <Typography variant="caption" color="text.secondary">
              As configuracoes sao salvas localmente no navegador (localStorage).
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between' }}>
        <Button
          onClick={handleCopy}
          variant="outlined"
          color="inherit"
          startIcon={copied ? <CheckIcon color="success" /> : <CopyIcon />}
        >
          {copied ? 'Copiado!' : 'Copiar texto'}
        </Button>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button onClick={handleMailto} variant="outlined" startIcon={<OpenIcon />}>
            Abrir no cliente de e-mail
          </Button>
          <Button onClick={handleSendEmailJs} variant="contained" startIcon={<SendIcon />} disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar via EmailJS'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
