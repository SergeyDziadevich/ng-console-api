export const PAYMENT_PATTERNS = {
  CREATE_CHECKOUT: 'payments.createCheckout',
  VERIFY_SESSION: 'payments.verifySession',
  CREATE_PORTAL: 'payments.createPortal',
  GET_SUBSCRIPTION: 'payments.getSubscription',
  GET_INVOICES: 'payments.getInvoices',
  HANDLE_WEBHOOK: 'payments.handleWebhook',
} as const;

export interface CreateCheckoutCommand {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface VerifySessionCommand {
  sessionId: string;
}

export interface CreatePortalCommand {
  userId: string;
  returnUrl: string;
}

export interface GetSubscriptionCommand {
  userId: string;
}

export interface GetInvoicesCommand {
  userId: string;
}

export interface HandleWebhookCommand {
  payload: string;
  signature: string;
}

export interface CheckoutSessionDto {
  sessionId: string;
  url: string;
}

export interface SubscriptionDto {
  id: string;
  status: string;
  planName?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

export interface InvoiceDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
  date: number;
}
