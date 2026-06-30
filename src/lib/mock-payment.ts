export interface PaymentRequest {
  amount: number;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string | null;
  message: string;
}

function generateTransactionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'txn_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Simulates payment processing with a 1.5 second delay.
 * Only accepts the demo card: 4242 4242 4242 4242, 07/12, 301.
 * Any other details will be declined.
 */
export async function processPayment(
  payment: PaymentRequest,
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const validCard = '4242424242424242';
  const validExpiry = '07/12';
  const validCvc = '301';

  const inputCard = payment.cardNumber.replace(/\s/g, '');
  const inputExpiry = payment.expiryDate.trim();
  const inputCvc = payment.cvc.trim();

  if (inputCard !== validCard || inputExpiry !== validExpiry || inputCvc !== validCvc) {
    return {
      success: false,
      transactionId: null,
      message: 'Payment declined. Please check your card details.',
    };
  }

  return {
    success: true,
    transactionId: generateTransactionId(),
    message: 'Payment successful',
  };
}
