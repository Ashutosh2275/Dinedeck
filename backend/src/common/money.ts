import { Decimal } from 'decimal.js';

export interface TaxBreakdown {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  packagingCharge: number;
  roundOffAmount: number;
  grandTotal: number;
  formattedGrandTotal: string;
}

export class Money {
  private amount: Decimal;

  constructor(value: number | string | Decimal) {
    this.amount = new Decimal(value);
  }

  public get value(): number {
    return this.amount.toNumber();
  }

  public toDecimal(): Decimal {
    return this.amount;
  }

  public add(other: Money | number): Money {
    const o = other instanceof Money ? other.amount : new Decimal(other);
    return new Money(this.amount.plus(o));
  }

  public subtract(other: Money | number): Money {
    const o = other instanceof Money ? other.amount : new Decimal(other);
    return new Money(this.amount.minus(o));
  }

  public multiply(factor: number): Money {
    return new Money(this.amount.times(new Decimal(factor)));
  }

  public percentage(percent: number): Money {
    return new Money(this.amount.times(new Decimal(percent)).dividedBy(100));
  }

  public round(decimalPlaces: number = 2): Money {
    return new Money(this.amount.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP));
  }

  public formatInr(): string {
    const val = this.amount.toNumber();
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: val % 1 === 0 ? 0 : 2
    }).format(val);
  }
}

export class IndiaBillingEngine {
  public static calculateBill(params: {
    subtotal: number;
    discountAmount?: number;
    cgstRatePercent?: number; // default 2.5%
    sgstRatePercent?: number; // default 2.5%
    serviceChargePercent?: number; // default 5.0%
    packagingCharge?: number;
  }): TaxBreakdown {
    const subtotal = new Decimal(params.subtotal);
    const discount = new Decimal(params.discountAmount || 0);
    const taxableAmount = Decimal.max(0, subtotal.minus(discount));

    const cgstRate = new Decimal(params.cgstRatePercent ?? 2.5);
    const sgstRate = new Decimal(params.sgstRatePercent ?? 2.5);
    const serviceChargeRate = new Decimal(params.serviceChargePercent ?? 5.0);
    const packaging = new Decimal(params.packagingCharge ?? 0.0);

    const cgst = taxableAmount.times(cgstRate).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const sgst = taxableAmount.times(sgstRate).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const serviceCharge = taxableAmount.times(serviceChargeRate).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const rawTotal = taxableAmount.plus(cgst).plus(sgst).plus(serviceCharge).plus(packaging);
    
    // Nearest rupee round off for Indian billing standards
    const grandTotalRounded = rawTotal.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    const roundOff = grandTotalRounded.minus(rawTotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      subtotal: subtotal.toNumber(),
      discountAmount: discount.toNumber(),
      taxableAmount: taxableAmount.toNumber(),
      cgstRatePercent: cgstRate.toNumber(),
      cgstAmount: cgst.toNumber(),
      sgstRatePercent: sgstRate.toNumber(),
      sgstAmount: sgst.toNumber(),
      serviceChargePercent: serviceChargeRate.toNumber(),
      serviceChargeAmount: serviceCharge.toNumber(),
      packagingCharge: packaging.toNumber(),
      roundOffAmount: roundOff.toNumber(),
      grandTotal: grandTotalRounded.toNumber(),
      formattedGrandTotal: new Money(grandTotalRounded).formatInr()
    };
  }
}
