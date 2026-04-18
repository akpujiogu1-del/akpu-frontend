declare module "@paystack/inline-js" {
  interface TransactionSuccess {
    reference: string;
    trans: string;
    status: string;
    message: string;
    transaction: string;
    trxref: string;
  }

  interface PaystackOptions {
    key: string;
    email: string;
    amount: number;
    ref?: string;
    currency?: string;
    metadata?: Record<string, any>;
    onSuccess: (transaction: TransactionSuccess) => void;
    onCancel: () => void;
  }

  class PaystackPop {
    newTransaction(options: PaystackOptions): void;
  }

  export default PaystackPop;
}
