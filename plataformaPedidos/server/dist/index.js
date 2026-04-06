import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { appendEmailLog, readEmailLogs } from './logger.js';
import { sendEmail } from './mailer.js';
const app = express();
app.use(cors({ origin: config.allowedOrigin }));
app.use(express.json({ limit: '12mb' }));
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'lubefer-bff', timestamp: new Date().toISOString() });
});
app.get('/api/email/history', (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const status = req.query.status === 'SUCCESS' || req.query.status === 'ERROR'
        ? req.query.status
        : undefined;
    const items = readEmailLogs(config.logCsvPath, { from, to, status });
    res.json({ ok: true, items });
});
app.post('/api/email/send', async (req, res) => {
    const payload = req.body;
    if (!payload || !payload.subject || !payload.textBody || !payload.htmlBody) {
        return res.status(400).json({ error: 'Payload invalido. Campos obrigatorios: subject, textBody, htmlBody.' });
    }
    if (!payload.to?.trim() && !config.smtp.defaultTo) {
        return res.status(400).json({ error: 'Destinatario ausente e nenhum destinatario padrao configurado.' });
    }
    try {
        const info = await sendEmail(payload);
        appendEmailLog(config.logCsvPath, {
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            to: info.to,
            cc: info.cc,
            bcc: info.bcc,
            subject: payload.subject,
            documentType: payload.metadata?.documentType || 'none',
            orderNumber: payload.metadata?.orderNumber || '',
            clientName: payload.metadata?.clientName || '',
            messageId: info.messageId,
            error: '',
        });
        return res.json({ ok: true, messageId: info.messageId });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Erro inesperado ao enviar email.';
        appendEmailLog(config.logCsvPath, {
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            to: payload.to || config.smtp.defaultTo,
            cc: payload.cc || '',
            bcc: config.smtp.auditBcc,
            subject: payload.subject || '',
            documentType: payload.metadata?.documentType || 'none',
            orderNumber: payload.metadata?.orderNumber || '',
            clientName: payload.metadata?.clientName || '',
            messageId: '',
            error: errMsg,
        });
        return res.status(500).json({ error: errMsg });
    }
});
const frontendDistPath = path.resolve(process.cwd(), '..', 'frontend', 'dist');
const frontendPublicPath = path.resolve(process.cwd(), '..', 'frontend', 'public');
// Serve the live data directories directly from the source public/ folder so that
// replacing a spreadsheet file (catalogo, clientes, branding) is immediately visible
// to the polling mechanism — without requiring a frontend rebuild or server restart.
const liveDataDirs = ['catalogo', 'clientes', 'branding'];
for (const dir of liveDataDirs) {
    const fullPath = path.join(frontendPublicPath, dir);
    if (fs.existsSync(fullPath)) {
        app.use(`/${dir}`, express.static(fullPath));
    }
}
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}
app.listen(config.port, () => {
    console.log(`[lubefer-bff] online em http://localhost:${config.port}`);
});
