import { useState } from 'react';
import type { Order, SmtpConfig } from '../types';
import { buildEmailBody, buildEmailHtml } from '../utils/emailBuilder';
import { Mail, Send, Copy, Check, ExternalLink } from 'lucide-react';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';

interface Props {
  order: Order;
  smtpConfig: SmtpConfig;
  onConfigChange: (config: SmtpConfig) => void;
  onClose: () => void;
}

type Tab = 'preview' | 'html' | 'config';

export default function EmailModal({ order, smtpConfig: initialConfig, onConfigChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('preview');
  const [config, setConfig] = useState<SmtpConfig>(initialConfig);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const plainBody = buildEmailBody(order);
  const htmlBody = buildEmailHtml(order);

  const subject = `Pedido de Vendas Nº ${order.numero} — ${order.cliente.razaoSocial}`;

  async function handleSendEmailJs() {
    if (!config.serviceId || !config.templateId || !config.publicKey) {
      toast.error('Preencha as configurações do EmailJS antes de enviar.');
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
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function setField(key: keyof SmtpConfig, value: string) {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    onConfigChange(updated);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-gray-800">Template de E-mail</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 transition text-gray-500 text-xl font-bold leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 px-6">
          {(['preview', 'html', 'config'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'preview' ? 'Texto' : t === 'html' ? 'HTML' : 'Configurações'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Email meta */}
          {tab !== 'config' && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-1">
              <div><span className="text-gray-500 w-16 inline-block">Para:</span> <strong>{config.toEmail || order.cliente.email || '—'}</strong></div>
              <div><span className="text-gray-500 w-16 inline-block">Assunto:</span> {subject}</div>
            </div>
          )}

          {tab === 'preview' && (
            <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 font-mono leading-relaxed">
              {plainBody}
            </pre>
          )}

          {tab === 'html' && (
            <iframe
              srcDoc={htmlBody}
              title="Email HTML preview"
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '420px' }}
              sandbox="allow-same-origin"
            />
          )}

          {tab === 'config' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <strong>Como funciona:</strong> O envio usa o{' '}
                <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
                  EmailJS <ExternalLink className="h-3 w-3" />
                </a>{' '}
                (gratuito para até 200 e-mails/mês). Crie uma conta, configure seu serviço de e-mail (Gmail, Outlook, etc.) e cole as chaves abaixo.
              </div>

              {[
                { key: 'serviceId' as keyof SmtpConfig, label: 'Service ID', placeholder: 'service_xxxxxxx' },
                { key: 'templateId' as keyof SmtpConfig, label: 'Template ID', placeholder: 'template_xxxxxxx' },
                { key: 'publicKey' as keyof SmtpConfig, label: 'Public Key', placeholder: 'your_public_key' },
                { key: 'fromName' as keyof SmtpConfig, label: 'Nome do Remetente', placeholder: 'Equipe Comercial' },
                { key: 'toEmail' as keyof SmtpConfig, label: 'Destinatário (padrão)', placeholder: order.cliente.email || 'cliente@empresa.com' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </div>
              ))}

              <p className="text-xs text-gray-500">
                * As configurações são salvas localmente no navegador (localStorage).
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 bg-gray-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar texto'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMailto}
              className="flex items-center gap-2 rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir no cliente de e-mail
            </button>

            <button
              onClick={handleSendEmailJs}
              disabled={sending}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition"
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? 'Enviando…' : 'Enviar via EmailJS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
