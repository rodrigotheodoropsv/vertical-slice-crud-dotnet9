import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { BrandingConfig, Order } from '../types';
import { formatBRL } from '../utils/productMapper';

interface Props {
  order: Order;
  branding: BrandingConfig;
  /** Absolute URL or base64 data URI for the company logo. Pass '' to omit. */
  logoUrl: string;
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  blue:      '#1a3f6f',
  tableHead: '#2c5f8a',
  border:    '#b0b8c4',
  altRow:    '#f3f6fb',
  dimText:   '#555f6e',
  red:       '#c00000',
  text:      '#0d0d0d',
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.text,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },

  /* ── Header ── */
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  logo:   { width: 110, height: 36, objectFit: 'contain', marginRight: 10 },

  companyBlock: { flex: 1, justifyContent: 'center' },
  companyName:  { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.blue },
  companyLine:  { fontSize: 6.5, color: '#444', marginTop: 1.5 },

  pedidoBox:   {
    borderWidth: 1.5, borderColor: C.blue,
    paddingHorizontal: 10, paddingVertical: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  pedidoLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.blue, letterSpacing: 1 },
  pedidoNum:   { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.red, marginTop: 2 },

  separator: { borderTopWidth: 1.5, borderTopColor: C.blue, marginBottom: 5 },

  /* ── Client info grid ── */
  clientGrid: { borderWidth: 0.75, borderColor: C.border, marginBottom: 5 },

  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  gridLastRow: { flexDirection: 'row' },

  infoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRightWidth: 0.5,
    borderRightColor: C.border,
  },
  infoCellLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  infoLabel: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.dimText, marginRight: 3 },
  infoValue: { fontSize: 7, flex: 1 },

  /* ── Product table ── */
  table: { borderWidth: 0.75, borderColor: C.border, marginBottom: 5 },

  tHead:     { flexDirection: 'row', backgroundColor: C.tableHead },
  tHCellB:   { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: 'white', paddingHorizontal: 4, paddingVertical: 3.5, borderRightWidth: 0.5, borderRightColor: '#4a7cad' },
  tHCellL:   { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: 'white', paddingHorizontal: 4, paddingVertical: 3.5 },

  tRow:    { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  tAltRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.altRow },
  tLastRow:    { flexDirection: 'row' },
  tLastAltRow: { flexDirection: 'row', backgroundColor: C.altRow },

  tCellB: { fontSize: 7, paddingHorizontal: 4, paddingVertical: 2.5, borderRightWidth: 0.5, borderRightColor: C.border },
  tCellL: { fontSize: 7, paddingHorizontal: 4, paddingVertical: 2.5 },

  /* ── Totals ── */
  totalsBox: { alignItems: 'flex-end', marginBottom: 5 },

  totalProdRow: { flexDirection: 'row', marginBottom: 1.5 },
  tpLabel: { fontSize: 7.5, color: C.dimText, textAlign: 'right', marginRight: 10 },
  tpValue: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: '#333', width: 84, textAlign: 'right' },

  totalImpostosRow: { flexDirection: 'row' },
  tiLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.blue, textAlign: 'right', marginRight: 10 },
  tiValue: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.red, width: 84, textAlign: 'right' },

  /* ── Observations ── */
  obsTitle: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.dimText, marginBottom: 2 },
  obsBox:   { borderWidth: 0.75, borderColor: C.border, padding: 6, minHeight: 44, marginBottom: 6 },
  obsText:  { fontSize: 7 },

  /* ── Signatures ── */
  sigsRow:  { flexDirection: 'row', marginTop: 16 },
  sigSlot:  { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  sigLine:  { borderTopWidth: 1, borderTopColor: C.text, width: '100%', marginBottom: 4 },
  sigLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.dimText },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ipiFormat(pct: number): string {
  return pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderPDF({ order, branding, logoUrl }: Props) {
  const fm = order.fieldMapping;
  const lastIdx = order.itens.length - 1;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ══ Header ══ */}
        <View style={s.header}>
          {logoUrl ? (
            <Image src={logoUrl} style={s.logo} />
          ) : null}

          <View style={s.companyBlock}>
            <Text style={s.companyName}>{branding.companyName.toUpperCase()}</Text>
            <Text style={s.companyLine}>Rodovia Dom Pedro I (SP-065), KM103 - Ponte Nova - CEP 13252-320 - Itatiba/SP</Text>
            <Text style={s.companyLine}>PABX: (11) 4894-7474  |  www.lubefer.com.br  |  vendas@lubefer.com.br</Text>
          </View>

          <View style={s.pedidoBox}>
            <Text style={s.pedidoLabel}>PEDIDO</Text>
            <Text style={s.pedidoNum}>Nº {order.numero}</Text>
          </View>
        </View>

        <View style={s.separator} />

        {/* ══ Client info grid ══ */}
        <View style={s.clientGrid}>

          {/* Data | Pedido Nº | Folha */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoLabel}>Data:</Text>
              <Text style={s.infoValue}>{order.data}</Text>
            </View>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>Pedido Nº:</Text>
              <Text style={s.infoValue}>{order.numero}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoLabel}>Folha:</Text>
              <Text style={s.infoValue}>1 / 1</Text>
            </View>
          </View>

          {/* Cliente | Cód. Cliente */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 3 }]}>
              <Text style={s.infoLabel}>Cliente:</Text>
              <Text style={s.infoValue}>{order.cliente.razaoSocial}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoLabel}>Cód. Cliente:</Text>
              <Text style={s.infoValue}>{order.cliente.codCliente ?? ''}</Text>
            </View>
          </View>

          {/* End. | Bairro */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 3 }]}>
              <Text style={s.infoLabel}>End.:</Text>
              <Text style={s.infoValue}>{order.cliente.endereco}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoLabel}>Bairro:</Text>
              <Text style={s.infoValue}>{order.cliente.bairro ?? ''}</Text>
            </View>
          </View>

          {/* Fone | CNPJ | INSCR. ESTAD. */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 1.2 }]}>
              <Text style={s.infoLabel}>Fone:</Text>
              <Text style={s.infoValue}>{order.cliente.telefone}</Text>
            </View>
            <View style={[s.infoCell, { flex: 1.8 }]}>
              <Text style={s.infoLabel}>CNPJ:</Text>
              <Text style={s.infoValue}>{order.cliente.cnpj}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoLabel}>Inscr. Estad.:</Text>
              <Text style={s.infoValue}>{order.cliente.inscricaoEstadual ?? ''}</Text>
            </View>
          </View>

          {/* Vendedor | CEP | Cidade | Estado */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>Vendedor:</Text>
              <Text style={s.infoValue}>{order.vendedor}</Text>
            </View>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoLabel}>CEP:</Text>
              <Text style={s.infoValue}>{order.cliente.cep ?? ''}</Text>
            </View>
            <View style={[s.infoCell, { flex: 1.5 }]}>
              <Text style={s.infoLabel}>Cidade:</Text>
              <Text style={s.infoValue}>{order.cliente.cidade ?? ''}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 0.5 }]}>
              <Text style={s.infoLabel}>Estado:</Text>
              <Text style={s.infoValue}>{order.cliente.estado ?? ''}</Text>
            </View>
          </View>

          {/* Condições | Transporte */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoLabel}>Condições:</Text>
              <Text style={s.infoValue}>{order.condicaoPagamento}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoLabel}>Transporte:</Text>
              <Text style={s.infoValue}>{order.prazoEntrega}</Text>
            </View>
          </View>

          {/* Comprador | E-mail */}
          <View style={s.gridLastRow}>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoLabel}>Comprador:</Text>
              <Text style={s.infoValue}>{order.cliente.comprador ?? ''}</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 2 }]}>
              <Text style={s.infoLabel}>E-mail:</Text>
              <Text style={s.infoValue}>{order.cliente.email}</Text>
            </View>
          </View>

        </View>

        {/* ══ Product table ══ */}
        <View style={s.table}>

          {/* Header row */}
          <View style={s.tHead}>
            <Text style={[s.tHCellB, { width: 28, textAlign: 'center' }]}>QTD</Text>
            <Text style={[s.tHCellB, { width: 36 }]}>GRUP</Text>
            <Text style={[s.tHCellB, { width: 58 }]}>CÓD.</Text>
            <Text style={[s.tHCellB, { flex: 1 }]}>DESCRIÇÃO</Text>
            <Text style={[s.tHCellB, { width: 62, textAlign: 'right' }]}>PREÇO UN</Text>
            <Text style={[s.tHCellB, { width: 62, textAlign: 'right' }]}>TOTAL</Text>
            <Text style={[s.tHCellL, { width: 35, textAlign: 'center' }]}>IPI</Text>
          </View>

          {/* Item rows — no empty rows */}
          {order.itens.map((item, idx) => {
            const id    = String(item.row[fm.idCol]    ?? '');
            const nome  = String(item.row[fm.nomeCol]  ?? '');
            const grupo = fm.grupoCol ? String(item.row[fm.grupoCol] ?? '') : '';
            const isLast = idx === lastIdx;
            const rowStyle = isLast
              ? (idx % 2 === 0 ? s.tLastRow   : s.tLastAltRow)
              : (idx % 2 === 0 ? s.tRow        : s.tAltRow);

            return (
              <View key={id || idx} style={rowStyle}>
                <Text style={[s.tCellB, { width: 28, textAlign: 'center' }]}>{item.quantidade}</Text>
                <Text style={[s.tCellB, { width: 36 }]}>{grupo}</Text>
                <Text style={[s.tCellB, { width: 58 }]}>{id}</Text>
                <Text style={[s.tCellB, { flex: 1 }]}>{nome}</Text>
                <Text style={[s.tCellB, { width: 62, textAlign: 'right' }]}>{formatBRL(item.unitPrice)}</Text>
                <Text style={[s.tCellB, { width: 62, textAlign: 'right' }]}>{formatBRL(item.subtotal)}</Text>
                <Text style={[s.tCellL, { width: 35, textAlign: 'center' }]}>{ipiFormat(item.ipiPct)}</Text>
              </View>
            );
          })}

        </View>

        {/* ══ Totals ══ */}
        <View style={s.totalsBox}>
          <View style={s.totalProdRow}>
            <Text style={s.tpLabel}>TOTAL DOS PRODUTOS:</Text>
            <Text style={s.tpValue}>{formatBRL(order.totalProdutos)}</Text>
          </View>
          <View style={s.totalImpostosRow}>
            <Text style={s.tiLabel}>TOTAL C/ IMPOSTOS:</Text>
            <Text style={s.tiValue}>{formatBRL(order.totalComImpostos)}</Text>
          </View>
        </View>

        {/* ══ Observations ══ */}
        <Text style={s.obsTitle}>OBSERVAÇÕES:</Text>
        <View style={s.obsBox}>
          <Text style={s.obsText}>{order.observacoes ?? ''}</Text>
        </View>

      </Page>
    </Document>
  );
}
