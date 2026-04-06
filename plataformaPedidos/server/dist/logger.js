import fs from 'fs';
import path from 'path';
const HEADER = [
    'timestamp',
    'status',
    'to',
    'cc',
    'bcc',
    'subject',
    'documentType',
    'orderNumber',
    'clientName',
    'messageId',
    'error',
].join(',');
function escapeCsv(value) {
    const sanitized = value.replace(/\r?\n/g, ' ').trim();
    return /[",;]/.test(sanitized) ? `"${sanitized.replace(/"/g, '""')}"` : sanitized;
}
function parseCsvLine(line) {
    const out = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            const next = line[i + 1];
            if (inQuotes && next === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (ch === ',' && !inQuotes) {
            out.push(current);
            current = '';
            continue;
        }
        current += ch;
    }
    out.push(current);
    return out;
}
export function appendEmailLog(csvPath, row) {
    const absolutePath = path.resolve(process.cwd(), csvPath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(absolutePath)) {
        fs.writeFileSync(absolutePath, `${HEADER}\n`, 'utf8');
    }
    const line = [
        row.timestamp,
        row.status,
        row.to,
        row.cc,
        row.bcc,
        row.subject,
        row.documentType,
        row.orderNumber,
        row.clientName,
        row.messageId,
        row.error,
    ]
        .map((v) => escapeCsv(v ?? ''))
        .join(',');
    fs.appendFileSync(absolutePath, `${line}\n`, 'utf8');
}
export function readEmailLogs(csvPath, filter) {
    const absolutePath = path.resolve(process.cwd(), csvPath);
    if (!fs.existsSync(absolutePath))
        return [];
    const raw = fs.readFileSync(absolutePath, 'utf8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1)
        return [];
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 11)
            continue;
        rows.push({
            timestamp: cols[0] ?? '',
            status: cols[1] ?? 'ERROR',
            to: cols[2] ?? '',
            cc: cols[3] ?? '',
            bcc: cols[4] ?? '',
            subject: cols[5] ?? '',
            documentType: cols[6] ?? '',
            orderNumber: cols[7] ?? '',
            clientName: cols[8] ?? '',
            messageId: cols[9] ?? '',
            error: cols[10] ?? '',
        });
    }
    const fromDate = filter?.from ? new Date(`${filter.from}T00:00:00`) : null;
    const toDate = filter?.to ? new Date(`${filter.to}T23:59:59`) : null;
    const filtered = rows.filter((r) => {
        if (filter?.status && r.status !== filter.status)
            return false;
        const ts = new Date(r.timestamp);
        if (fromDate && ts < fromDate)
            return false;
        if (toDate && ts > toDate)
            return false;
        return true;
    });
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
