import { Decimal } from 'decimal.js';
import { BillCalculationBreakdown, DiscountType } from './billing.types.js';

export class BillingEngine {
  /**
   * Authoritative Bill & Tax Calculation Engine using Decimal.js precision
   */
  public static calculateBill(params: {
    itemPrices: Array<{ unitPrice: number; quantity: number }>;
    discountType?: DiscountType;
    discountValue?: number; // percent (0-100) or fixed amount
    discountReason?: string | null;
    complimentaryReason?: string | null;
    cgstRatePercent?: number; // e.g. 2.5
    sgstRatePercent?: number; // e.g. 2.5
    serviceChargePercent?: number; // e.g. 5.0
    paidAmount?: number;
  }): BillCalculationBreakdown {
    const cgstRate = new Decimal(params.cgstRatePercent ?? 2.5);
    const sgstRate = new Decimal(params.sgstRatePercent ?? 2.5);
    const scRate = new Decimal(params.serviceChargePercent ?? 5.0);

    // 1. Calculate Gross Subtotal
    let subtotalDec = new Decimal(0);
    for (const item of params.itemPrices) {
      const lineTotal = new Decimal(item.unitPrice).times(new Decimal(item.quantity));
      subtotalDec = subtotalDec.plus(lineTotal);
    }
    const subtotal = subtotalDec.toDecimalPlaces(2).toNumber();

    // 2. Calculate Discount
    const discountType: DiscountType = params.discountType || 'NONE';
    let discountDec = new Decimal(0);

    if (discountType === 'PERCENTAGE') {
      const pct = Math.min(100, Math.max(0, params.discountValue ?? 0));
      discountDec = subtotalDec.times(new Decimal(pct)).dividedBy(100);
    } else if (discountType === 'FIXED') {
      const fixed = Math.max(0, params.discountValue ?? 0);
      discountDec = Decimal.min(subtotalDec, new Decimal(fixed));
    } else if (discountType === 'COMPLIMENTARY') {
      discountDec = subtotalDec; // 100% complimentary
    }

    const discountAmount = discountDec.toDecimalPlaces(2).toNumber();
    const discountPercent = discountType === 'PERCENTAGE' 
      ? Number(params.discountValue ?? 0)
      : subtotal > 0 ? Number(((discountAmount / subtotal) * 100).toFixed(1)) : 0;

    // 3. Taxable Amount
    const taxableDec = Decimal.max(0, subtotalDec.minus(discountDec));
    const taxableAmount = taxableDec.toDecimalPlaces(2).toNumber();

    // 4. Taxes & Service Charge
    const cgstDec = taxableDec.times(cgstRate).dividedBy(100).toDecimalPlaces(2);
    const sgstDec = taxableDec.times(sgstRate).dividedBy(100).toDecimalPlaces(2);
    const scDec = taxableDec.times(scRate).dividedBy(100).toDecimalPlaces(2);

    const cgstAmount = cgstDec.toNumber();
    const sgstAmount = sgstDec.toNumber();
    const serviceChargeAmount = scDec.toNumber();

    // 5. Exact Total & Standard Indian Currency Round-off
    const exactTotalDec = taxableDec.plus(cgstDec).plus(sgstDec).plus(scDec);
    const exactTotal = exactTotalDec.toDecimalPlaces(2).toNumber();
    const grandTotal = Math.round(exactTotal);
    const roundOffAmount = new Decimal(grandTotal).minus(exactTotalDec).toDecimalPlaces(2).toNumber();

    // 6. Paid vs Remaining
    const totalPaidDec = new Decimal(params.paidAmount ?? 0);
    const totalPaid = totalPaidDec.toDecimalPlaces(2).toNumber();
    const remainingDec = Decimal.max(0, new Decimal(grandTotal).minus(totalPaidDec));
    const remainingBalance = remainingDec.toDecimalPlaces(2).toNumber();
    const isSettled = totalPaid >= grandTotal && grandTotal > 0;

    return {
      subtotal,
      discountType,
      discountPercent,
      discountAmount,
      discountReason: params.discountReason || null,
      complimentaryReason: params.complimentaryReason || null,
      taxableAmount,
      cgstRatePercent: cgstRate.toNumber(),
      cgstAmount,
      sgstRatePercent: sgstRate.toNumber(),
      sgstAmount,
      serviceChargePercent: scRate.toNumber(),
      serviceChargeAmount,
      exactTotal,
      roundOffAmount,
      grandTotal,
      totalPaid,
      remainingBalance,
      isSettled
    };
  }

  /**
   * Split Calculation for equal guest splits
   */
  public static calculateEqualSplit(grandTotal: number, numGuests: number): Array<{ guestIndex: number; shareAmount: number }> {
    const count = Math.max(1, numGuests);
    const baseShare = Math.floor(grandTotal / count);
    const remainder = grandTotal - (baseShare * count);

    return Array.from({ length: count }, (_, idx) => ({
      guestIndex: idx + 1,
      shareAmount: idx === count - 1 ? baseShare + remainder : baseShare
    }));
  }

  /**
   * Format ESC/POS 80mm Standard Thermal Paper Receipt
   */
  public static formatThermalReceipt(params: {
    restaurant: {
      name: string;
      fullAddress: string;
      phone: string;
      gstin?: string | null;
      fssaiNumber?: string | null;
      legalBusinessName?: string | null;
    };
    branchName?: string;
    billNumber: string;
    tableNumber: string;
    sessionToken: string;
    date: Date;
    items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number; variantName?: string | null }>;
    calculation: BillCalculationBreakdown;
    paymentMethod: string;
    transactionRef?: string | null;
    reprintCount?: number;
    cashierName?: string | null;
  }): string {
    const { restaurant, billNumber, tableNumber, date, items, calculation, paymentMethod, transactionRef, reprintCount, cashierName } = params;
    
    const dateStr = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const isReprint = (reprintCount || 0) > 0;

    const divider = '------------------------------------------------';
    const doubleDivider = '================================================';

    const itemLines = items.map(item => {
      const name = (item.name + (item.variantName ? ` (${item.variantName})` : '')).slice(0, 26).padEnd(26);
      const qty = String(item.quantity).padStart(3);
      const rate = item.unitPrice.toFixed(0).padStart(7);
      const total = item.totalPrice.toFixed(2).padStart(10);
      return `${name} ${qty} ${rate} ${total}`;
    }).join('\n');

    return `
${doubleDivider}
          ${restaurant.name.toUpperCase()}
       ${restaurant.legalBusinessName || 'RESTAURANT & BAR'}
${restaurant.fullAddress}
Tel: ${restaurant.phone}
${restaurant.gstin ? `GSTIN: ${restaurant.gstin}` : ''}  ${restaurant.fssaiNumber ? `FSSAI: ${restaurant.fssaiNumber}` : ''}
${doubleDivider}
                TAX INVOICE
INVOICE NO : ${billNumber} ${isReprint ? `(DUPLICATE REPRINT #${reprintCount})` : ''}
DATE & TIME: ${dateStr}
TABLE NO   : Table #${tableNumber}
PAYMENT    : ${paymentMethod.toUpperCase()} ${transactionRef ? `[Ref: ${transactionRef}]` : ''}
CASHIER    : ${cashierName || 'POS Station'}
${divider}
ITEM DESCRIPTION           QTY    RATE     AMOUNT (₹)
${divider}
${itemLines}
${divider}
SUBTOTAL (Gross)                         ₹${calculation.subtotal.toFixed(2).padStart(9)}
${calculation.discountAmount > 0 ? `DISCOUNT (${calculation.discountPercent}%)                    -₹${calculation.discountAmount.toFixed(2).padStart(9)}` : ''}
TAXABLE VALUE                            ₹${calculation.taxableAmount.toFixed(2).padStart(9)}
CGST (${calculation.cgstRatePercent}%)                                ₹${calculation.cgstAmount.toFixed(2).padStart(9)}
SGST (${calculation.sgstRatePercent}%)                                ₹${calculation.sgstAmount.toFixed(2).padStart(9)}
SERVICE CHARGE (${calculation.serviceChargePercent}%)                    ₹${calculation.serviceChargeAmount.toFixed(2).padStart(9)}
ROUND OFF                                ₹${calculation.roundOffAmount.toFixed(2).padStart(9)}
${doubleDivider}
GRAND TOTAL (INCL. OF ALL TAXES)         ₹${calculation.grandTotal.toFixed(2).padStart(9)}
${doubleDivider}
STATUS: ${calculation.isSettled ? 'PAID IN FULL - THANK YOU' : `BALANCE DUE: ₹${calculation.remainingBalance.toFixed(2)}`}

GST Summary:
CGST ${calculation.cgstRatePercent}% on ₹${calculation.taxableAmount.toFixed(2)} = ₹${calculation.cgstAmount.toFixed(2)}
SGST ${calculation.sgstRatePercent}% on ₹${calculation.taxableAmount.toFixed(2)} = ₹${calculation.sgstAmount.toFixed(2)}

         Thank you for dining with us!
       Powered by DINEDECK Realtime POS
${doubleDivider}
`;
  }
}
