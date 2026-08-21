export type PaymentProcessingResult = {
  approved: boolean;
  provider: 'MockPaymentProvider';
  transactionId: string;
  controlNumber: string;
  paymentReference: string;
};

export class MockPaymentProvider {
  generateControlNumber(invoiceNumber: string) {
    return `CTRL-${invoiceNumber.split('-').pop() ?? Date.now()}`;
  }

  generatePaymentReference(invoiceNumber: string) {
    return `REF-${invoiceNumber.split('-').pop() ?? Date.now()}`;
  }

  processPayment(amount: number, invoiceNumber: string): PaymentProcessingResult {
    const transactionId = `TXN-${Date.now()}`;
    const controlNumber = this.generateControlNumber(invoiceNumber);
    const paymentReference = this.generatePaymentReference(invoiceNumber);

    return {
      approved: amount > 0,
      provider: 'MockPaymentProvider',
      transactionId,
      controlNumber,
      paymentReference,
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
