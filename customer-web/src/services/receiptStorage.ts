// Offline Immutable Receipt Storage Engine
import { OfflineReceipt } from '../types';

const RECEIPT_STORAGE_KEY = 'dinedeck_customer_offline_receipts';

export const receiptStorage = {
  getReceipts(): OfflineReceipt[] {
    try {
      const raw = localStorage.getItem(RECEIPT_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[ReceiptStorage] Failed reading offline receipts:', e);
      return [];
    }
  },

  saveReceipt(receipt: OfflineReceipt): void {
    try {
      const existing = this.getReceipts();
      // Immutable storage: do not overwrite if already archived with same receiptId
      const filtered = existing.filter((r) => r.receiptId !== receipt.receiptId && r.billId !== receipt.billId);
      const updated = [receipt, ...filtered];
      localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[ReceiptStorage] Failed archiving offline receipt:', e);
    }
  },

  getReceiptById(receiptId: string): OfflineReceipt | undefined {
    return this.getReceipts().find((r) => r.receiptId === receiptId || r.billId === receiptId);
  }
};
