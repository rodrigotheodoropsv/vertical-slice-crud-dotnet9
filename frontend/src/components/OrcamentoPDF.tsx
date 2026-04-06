import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { BrandingConfig, Order } from '../types';
import { formatBRL } from '../utils/productMapper';

interface Props {
  order: Order;
  branding: BrandingConfig;
  logoUrl: string;
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  blue:       '#1a3f6f',
  tableHead:  '#2c5f8a',
  border:     '#b0b8c4',
  altRow:     '#f3f6fb',
  dimText:    '#555f6e',
  text:       '#0d0d0d',
  totalRowBg: '#bdd7ee',
  totaisHdr:  '#d6e4f0',
};

// ─── Styles ───────────────────────────────────────────────────────────────────
// A4 landscape: ~842 x 595 pts  →  usable width ≈ 802 pts (padding 20 each side)
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: C.text,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  /* ── Header ── */
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  logo:   { width: 90, height: 34, objectFit: 'contain' },

  orcTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: C.blue,
    letterSpacing: 2,
  },

  contactBlock: { alignItems: 'flex-end' },
  contactBold:  { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.blue },
  contactLine:  { fontSize: 6, color: '#333', marginTop: 1 },

  separator: { borderTopWidth: 1.5, borderTopColor: C.blue, marginBottom: 4 },

  /* ── Client info grid ── */
  clientGrid:  { borderWidth: 0.75, borderColor: C.border, marginBottom: 4 },
  gridRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  gridLastRow: { flexDirection: 'row' },

  infoCell: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 2.5,
    borderRightWidth: 0.5, borderRightColor: C.border,
  },
  infoCellLast: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 2.5,
  },
  infoLabel: { fontFamily: 'Helvetica-Bold', fontSize: 5.5, color: C.dimText, marginRight: 3 },
  infoValue: { fontSize: 6.5, flex: 1 },

  /* ── Product table ── */
  table: { borderWidth: 0.75, borderColor: C.border, marginBottom: 4 },

  tHead:   { flexDirection: 'row', backgroundColor: C.tableHead },
  tHCellB: {
    fontFamily: 'Helvetica-Bold', fontSize: 4.8, color: 'white',
    paddingHorizontal: 2, paddingVertical: 3,
    borderRightWidth: 0.5, borderRightColor: '#4a7cad',
    textAlign: 'center',
  },
  tHCellL: {
    fontFamily: 'Helvetica-Bold', fontSize: 4.8, color: 'white',
    paddingHorizontal: 2, paddingVertical: 3,
    textAlign: 'center',
  },

  tRow:        { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  tAltRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.altRow },
  tLastRow:    { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  tLastAltRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.altRow },

  tCellB: { fontSize: 6, paddingHorizontal: 2.5, paddingVertical: 2, borderRightWidth: 0.5, borderRightColor: C.border },
  tCellL: { fontSize: 6, paddingHorizontal: 2.5, paddingVertical: 2 },

  /* TOTAL row at bottom of product table */
  tTotalRow: {
    flexDirection: 'row',
    backgroundColor: C.totalRowBg,
    borderTopWidth: 0.75, borderTopColor: C.border,
  },

  /* ── Bottom section (two columns) ── */
  bottomSection: { flexDirection: 'row' },

  /* Left — TOTAIS */
  totaisBox:    { width: 198, borderWidth: 0.75, borderColor: C.border, marginRight: 6 },
  totaisTitleRow: {
    backgroundColor: C.tableHead,
    paddingVertical: 3, paddingHorizontal: 6,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  totaisTitleText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: 'white', textAlign: 'center' },

  totaisRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  totaisLastRow: { flexDirection: 'row', backgroundColor: C.totalRowBg },
  totaisLabel:   { fontSize: 6.5, paddingHorizontal: 5, paddingVertical: 3, flex: 1 },
  totaisLabelBold: { fontFamily: 'Helvetica-Bold', fontSize: 7, paddingHorizontal: 5, paddingVertical: 3, flex: 1 },
  totaisValue:   { fontSize: 6.5, paddingHorizontal: 5, paddingVertical: 3, textAlign: 'right', width: 70, borderLeftWidth: 0.5, borderLeftColor: C.border },
  totaisValueBold: { fontFamily: 'Helvetica-Bold', fontSize: 7, paddingHorizontal: 5, paddingVertical: 3, textAlign: 'right', width: 70, borderLeftWidth: 0.5, borderLeftColor: C.border, color: C.blue },

  /* Right — OBSERVAÇÕES */
  obsBox: { flex: 1, borderWidth: 0.75, borderColor: C.border },
  obsTitleRow: {
    backgroundColor: C.tableHead,
    paddingVertical: 3, paddingHorizontal: 6,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  obsTitleText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: 'white', textAlign: 'center' },

  obsRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  obsLastRow: { flexDirection: 'row' },
  obsLabel:   { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.dimText, paddingHorizontal: 5, paddingVertical: 3.5, width: 108, borderRightWidth: 0.5, borderRightColor: C.border },
  obsValue:   { fontSize: 6.5, paddingHorizontal: 5, paddingVertical: 3.5, flex: 1 },
  obsValueBold: { fontFamily: 'Helvetica-Bold', fontSize: 7, paddingHorizontal: 5, paddingVertical: 3.5, flex: 1, color: C.blue },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPct(pct: number): string {
  return pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrcamentoPDF({ order, branding, logoUrl }: Props) {
  const fm = order.fieldMapping;
  const ipiTotal = order.totalComImpostos - order.totalProdutos - order.totalST;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ══ Header ══ */}
        <View style={s.header}>
          {logoUrl ? <Image src={logoUrl} style={s.logo} /> : null}

          <Text style={s.orcTitle}>ORÇAMENTO</Text>

          <View style={s.contactBlock}>
            <Text style={s.contactBold}>PABX: (11) 4894-7474  |  {branding.companyName}</Text>
            <Text style={s.contactLine}>RODOVIA DOM PEDRO I (SP 065), KM 103</Text>
            <Text style={s.contactLine}>BAIRRO: PONTE NOVA - CEP: 13252-320 - ITATIBA - SP</Text>
            <Text style={s.contactLine}>www.lubefer.com.br  -  vendas@lubefer.com.br</Text>
          </View>
        </View>

        <View style={s.separator} />

        {/* ══ Client info grid ══ */}
        <View style={s.clientGrid}>

          {/* blank | Data */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 3 }]}>
              <Text style={s.infoValue}> </Text>
            </View>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoLabel}>Data</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoValue}>{order.data}</Text>
            </View>
          </View>

          {/* Cliente | Código do Cliente */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 0.8 }]}>
              <Text style={s.infoLabel}>Cliente</Text>
            </View>
            <View style={[s.infoCell, { flex: 3.2 }]}>
              <Text style={s.infoValue}>{order.cliente.razaoSocial}</Text>
            </View>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoLabel}>Código do Cliente</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoValue}>{order.cliente.codCliente ?? ''}</Text>
            </View>
          </View>

          {/* End. | Bairro | Fone */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 0.5 }]}>
              <Text style={s.infoLabel}>End.</Text>
            </View>
            <View style={[s.infoCell, { flex: 2.5 }]}>
              <Text style={s.infoValue}>{order.cliente.endereco}</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.5 }]}>
              <Text style={s.infoLabel}>Bairro</Text>
            </View>
            <View style={[s.infoCell, { flex: 1 }]}>
              <Text style={s.infoValue}>{order.cliente.bairro ?? ''}</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.5 }]}>
              <Text style={s.infoLabel}>Fone</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1 }]}>
              <Text style={s.infoValue}>{order.cliente.telefone}</Text>
            </View>
          </View>

          {/* CNPJ | INSCRIÇÃO ESTADUAL | Vendedor */}
          <View style={s.gridRow}>
            <View style={[s.infoCell, { flex: 0.6 }]}>
              <Text style={s.infoLabel}>CNPJ</Text>
            </View>
            <View style={[s.infoCell, { flex: 1.4 }]}>
              <Text style={s.infoValue}>{order.cliente.cnpj}</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.8 }]}>
              <Text style={s.infoLabel}>INSCRIÇÃO ESTADUAL</Text>
            </View>
            <View style={[s.infoCell, { flex: 1.2 }]}>
              <Text style={s.infoValue}>{order.cliente.inscricaoEstadual ?? ''}</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.5 }]}>
              <Text style={s.infoLabel}>Vendedor</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1.5 }]}>
              <Text style={s.infoValue}>{order.vendedor}</Text>
            </View>
          </View>

          {/* CEP | Cidade | Estado | Comprador */}
          <View style={s.gridLastRow}>
            <View style={[s.infoCell, { flex: 0.4 }]}>
              <Text style={s.infoLabel}>CEP</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.8 }]}>
              <Text style={s.infoValue}>{order.cliente.cep ?? ''}</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.4 }]}>
              <Text style={s.infoLabel}>Cidade</Text>
            </View>
            <View style={[s.infoCell, { flex: 1.2 }]}>
              <Text style={s.infoValue}>{order.cliente.cidade ?? ''}</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.4 }]}>
              <Text style={s.infoLabel}>Estado</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.4 }]}>
              <Text style={s.infoValue}>{order.cliente.estado ?? ''}</Text>
            </View>
            <View style={[s.infoCell, { flex: 0.6 }]}>
              <Text style={s.infoLabel}>Comprador</Text>
            </View>
            <View style={[s.infoCellLast, { flex: 1.8 }]}>
              <Text style={s.infoValue}>{order.cliente.comprador ?? ''}</Text>
            </View>
          </View>

        </View>

        {/* ══ Product table ══
            Columns (usable ≈ 802 pts):
            GRUP(24) | CÓD.(62) | DESCRIÇÃO(flex) | UNID.(28) | QTD(24)
            | VALOR UNIT.(60) | IPI(28) | VLR UNIT. DO IPI(60)
            | SUBST.TRIBUT.(36) | VLR UNIT. SUBST.(60) | VALOR TOTAL UNIT.(64) | VALOR TOTAL(66)
        */}
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.tHCellB, { width: 24 }]}>GRUP</Text>
            <Text style={[s.tHCellB, { width: 62 }]}>CÓD.</Text>
            <Text style={[s.tHCellB, { flex: 1, textAlign: 'left' }]}>DESCRIÇÃO</Text>
            <Text style={[s.tHCellB, { width: 28 }]}>UNID.</Text>
            <Text style={[s.tHCellB, { width: 24 }]}>QTD</Text>
            <Text style={[s.tHCellB, { width: 60, textAlign: 'right' }]}>{'VALOR\nUNIT.'}</Text>
            <Text style={[s.tHCellB, { width: 28 }]}>IPI</Text>
            <Text style={[s.tHCellB, { width: 60, textAlign: 'right' }]}>{'VALOR\nUNIT. DO\nIPI'}</Text>
            <Text style={[s.tHCellB, { width: 36 }]}>{'SUBST.\nTRIBUT.'}</Text>
            <Text style={[s.tHCellB, { width: 60, textAlign: 'right' }]}>{'VALOR\nUNIT. DA\nSUBST.'}</Text>
            <Text style={[s.tHCellB, { width: 64, textAlign: 'right' }]}>{'VALOR\nTOTAL\nUNIT.'}</Text>
            <Text style={[s.tHCellL, { width: 66, textAlign: 'right' }]}>{'VALOR\nTOTAL'}</Text>
          </View>

          {order.itens.map((item, idx) => {
            const id    = String(item.row[fm.idCol]   ?? '');
            const nome  = String(item.row[fm.nomeCol] ?? '');
            const grupo = fm.grupoCol ? String(item.row[fm.grupoCol] ?? '') : '';
            const unid  = String(item.row['Unidade'] ?? item.row['UN'] ?? item.row['Unid'] ?? '');

            const ipiUnitValue   = item.ipiPct > 0 ? item.ipiValue / item.quantidade : 0;
            const stUnitValue    = item.stPct > 0 ? item.stValue / item.quantidade : 0;
            const valorTotalUnit = item.unitPrice + ipiUnitValue + stUnitValue;
            const valorTotal     = valorTotalUnit * item.quantidade;

            const isEven = idx % 2 === 0;
            const rowStyle = isEven ? s.tRow : s.tAltRow;

            return (
              <View key={id || idx} style={rowStyle}>
                <Text style={[s.tCellB, { width: 24 }]}>{grupo}</Text>
                <Text style={[s.tCellB, { width: 62 }]}>{id}</Text>
                <Text style={[s.tCellB, { flex: 1 }]}>{nome}</Text>
                <Text style={[s.tCellB, { width: 28, textAlign: 'center' }]}>{unid}</Text>
                <Text style={[s.tCellB, { width: 24, textAlign: 'center' }]}>{item.quantidade}</Text>
                <Text style={[s.tCellB, { width: 60, textAlign: 'right' }]}>{formatBRL(item.unitPrice)}</Text>
                <Text style={[s.tCellB, { width: 28, textAlign: 'center' }]}>{item.ipiPct > 0 ? fmtPct(item.ipiPct) : '—'}</Text>
                <Text style={[s.tCellB, { width: 60, textAlign: 'right' }]}>{item.ipiPct > 0 ? formatBRL(ipiUnitValue) : '—'}</Text>
                <Text style={[s.tCellB, { width: 36, textAlign: 'center' }]}>{item.stPct > 0 ? fmtPct(item.stPct) : '—'}</Text>
                <Text style={[s.tCellB, { width: 60, textAlign: 'right' }]}>{item.stPct > 0 ? formatBRL(stUnitValue) : '—'}</Text>
                <Text style={[s.tCellB, { width: 64, textAlign: 'right' }]}>{formatBRL(valorTotalUnit)}</Text>
                <Text style={[s.tCellL, { width: 66, textAlign: 'right' }]}>{formatBRL(valorTotal)}</Text>
              </View>
            );
          })}

          {/* TOTAL row */}
          <View style={s.tTotalRow}>
            <Text style={[s.tCellB, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 7 }]}>TOTAL</Text>
            <Text style={[s.tCellL, { width: 66, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.blue }]}>
              {formatBRL(order.totalComImpostos)}
            </Text>
          </View>
        </View>

        {/* ══ Bottom section ══ */}
        <View style={s.bottomSection}>

          {/* Left — TOTAIS */}
          <View style={s.totaisBox}>
            <View style={s.totaisTitleRow}>
              <Text style={s.totaisTitleText}>TOTAIS</Text>
            </View>
            <View style={s.totaisRow}>
              <Text style={s.totaisLabel}>TOTAL DOS PRODUTOS</Text>
              <Text style={s.totaisValue}>{formatBRL(order.totalProdutos)}</Text>
            </View>
            <View style={s.totaisRow}>
              <Text style={s.totaisLabel}>TOTAL IPI: (+)</Text>
              <Text style={s.totaisValue}>{formatBRL(ipiTotal)}</Text>
            </View>
            <View style={s.totaisRow}>
              <Text style={s.totaisLabel}>TOTAL ST: (+)</Text>
              <Text style={s.totaisValue}>{formatBRL(order.totalST)}</Text>
            </View>
            <View style={s.totaisLastRow}>
              <Text style={s.totaisLabelBold}>ORÇAMENTO TOTAL</Text>
              <Text style={s.totaisValueBold}>{formatBRL(order.totalComImpostos)}</Text>
            </View>
          </View>

          {/* Right — OBSERVAÇÕES */}
          <View style={s.obsBox}>
            <View style={s.obsTitleRow}>
              <Text style={s.obsTitleText}>OBSERVAÇÕES</Text>
            </View>
            <View style={s.obsRow}>
              <Text style={s.obsLabel}>PRAZO DE ENTREGA:</Text>
              <Text style={s.obsValue}>{order.prazoEntrega}</Text>
            </View>
            <View style={s.obsRow}>
              <Text style={s.obsLabel}>VALIDADE DO ORÇAMENTO:</Text>
              <Text style={s.obsValue}>{order.validadeOrcamento || '05 DIAS ÚTEIS'}</Text>
            </View>
            <View style={s.obsRow}>
              <Text style={s.obsLabel}>CONDIÇÕES DE PAGAMENTO:</Text>
              <Text style={s.obsValueBold}>{order.condicaoPagamento}</Text>
            </View>
            <View style={s.obsLastRow}>
              <Text style={s.obsLabel}>FRETE:</Text>
              <Text style={s.obsValue}>{order.frete || 'CIF - ENTREGA PELO CARRO DA PRÓPRIA LUBEFER'}</Text>
            </View>
          </View>

        </View>

      </Page>
    </Document>
  );
}
