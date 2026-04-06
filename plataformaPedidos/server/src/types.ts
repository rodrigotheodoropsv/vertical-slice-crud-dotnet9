export interface SendEmailRequest {
  to: string;
  cc?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  fromName?: string;
  metadata?: {
    orderNumber?: string;
    clientName?: string;
    documentType?: 'pedido' | 'orcamento' | 'none';
  };
  attachment?: {
    filename: string;
    mimeType: string;
    contentBase64: string; // data URL or raw base64
  };
}

export interface EmailSendLogRow {
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  documentType: string;
  orderNumber: string;
  clientName: string;
  messageId: string;
  error: string;
}
