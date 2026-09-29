import { describe, it, expect } from 'vitest';
import { Money, IndiaBillingEngine } from '../src/common/money.js';

describe('DINEDECK India Money & Tax Engine Tests', () => {
  it('should format INR currency accurately according to Indian Numbering System', () => {
    expect(new Money(120).formatInr()).toBe('₹120');
    expect(new Money(1250).formatInr()).toBe('₹1,250');
    expect(new Money(12499.5).formatInr()).toBe('₹12,499.50');
  });

  it('should perform precise arithmetic with decimal safety', () => {
    const m1 = new Money(100.10);
    const m2 = new Money(200.20);
    const sum = m1.add(m2);
    expect(sum.value).toBe(300.30);
  });

  it('should calculate Indian GST (CGST 2.5% + SGST 2.5%) and 5% Service Charge accurately', () => {
    const breakdown = IndiaBillingEngine.calculateBill({
      subtotal: 1000,
      discountAmount: 100, // Taxable = 900
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0,
      packagingCharge: 0
    });

    expect(breakdown.subtotal).toBe(1000);
    expect(breakdown.discountAmount).toBe(100);
    expect(breakdown.taxableAmount).toBe(900);
    expect(breakdown.cgstAmount).toBe(22.5); // 2.5% of 900
    expect(breakdown.sgstAmount).toBe(22.5); // 2.5% of 900
    expect(breakdown.serviceChargeAmount).toBe(45); // 5% of 900
    expect(breakdown.grandTotal).toBe(990); // 900 + 22.5 + 22.5 + 45 = 990
  });

  it('should calculate round off to nearest rupee', () => {
    const breakdown = IndiaBillingEngine.calculateBill({
      subtotal: 33.33,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 0
    });

    expect(typeof breakdown.roundOffAmount).toBe('number');
    expect(breakdown.grandTotal % 1).toBe(0);
  });
});
