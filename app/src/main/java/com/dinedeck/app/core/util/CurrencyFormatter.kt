package com.dinedeck.app.core.util

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.NumberFormat
import java.util.Locale

/**
 * Precision Money value object for Indian Rupee (INR) calculations.
 * Avoids any floating-point representation bugs in customer billing and cart calculations.
 */
data class Money(
    val amount: BigDecimal
) : Comparable<Money> {

    constructor(value: Double) : this(BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP))
    constructor(value: Long) : this(BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP))
    constructor(value: Int) : this(BigDecimal.valueOf(value.toLong()).setScale(2, RoundingMode.HALF_UP))
    constructor(value: String) : this(BigDecimal(value).setScale(2, RoundingMode.HALF_UP))

    operator fun plus(other: Money): Money = Money(amount.add(other.amount).setScale(2, RoundingMode.HALF_UP))
    operator fun minus(other: Money): Money = Money(amount.subtract(other.amount).setScale(2, RoundingMode.HALF_UP))
    operator fun times(qty: Int): Money = Money(amount.multiply(BigDecimal.valueOf(qty.toLong())).setScale(2, RoundingMode.HALF_UP))
    operator fun times(factor: Double): Money = Money(amount.multiply(BigDecimal.valueOf(factor)).setScale(2, RoundingMode.HALF_UP))

    fun percentage(percent: Double): Money = Money(amount.multiply(BigDecimal.valueOf(percent)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))

    fun toDouble(): Double = amount.toDouble()

    fun formatInr(): String = CurrencyFormatter.formatInr(amount.toDouble())

    override fun compareTo(other: Money): Int = amount.compareTo(other.amount)

    companion object {
        val ZERO = Money(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
    }
}

object CurrencyFormatter {
    private val inLocale = Locale("en", "IN")

    /**
     * Formats an amount to Indian Rupee (₹) string.
     * Examples: ₹120, ₹1,250, ₹12,499.50
     */
    fun formatInr(amount: Double): String {
        val nf = NumberFormat.getCurrencyInstance(inLocale)
        // Ensure standard ₹ symbol
        val formatted = nf.format(amount)
        return if (amount % 1.0 == 0.0) {
            // Trim .00 for whole currency figures (e.g. ₹120 instead of ₹120.00)
            formatted.replace(".00", "")
        } else {
            formatted
        }
    }

    fun formatInr(amount: BigDecimal): String = formatInr(amount.toDouble())
}

data class IndianTaxCalculation(
    val subtotal: Money,
    val discountAmount: Money,
    val taxableAmount: Money,
    val cgstRatePercent: Double,
    val cgstAmount: Money,
    val sgstRatePercent: Double,
    val sgstAmount: Money,
    val serviceChargePercent: Double,
    val serviceChargeAmount: Money,
    val roundOff: Money,
    val grandTotal: Money
)

object TaxCalculator {
    fun calculateIndianTaxes(
        subtotal: Money,
        discountAmount: Money = Money.ZERO,
        cgstRatePercent: Double = 2.5,
        sgstRatePercent: Double = 2.5,
        serviceChargePercent: Double = 5.0
    ): IndianTaxCalculation {
        val taxable = if (subtotal > discountAmount) subtotal - discountAmount else Money.ZERO
        val cgst = taxable.percentage(cgstRatePercent)
        val sgst = taxable.percentage(sgstRatePercent)
        val serviceCharge = taxable.percentage(serviceChargePercent)

        val rawTotal = taxable + cgst + sgst + serviceCharge
        val roundedTotal = Money(rawTotal.amount.setScale(0, RoundingMode.HALF_UP))
        val roundOff = roundedTotal - rawTotal

        return IndianTaxCalculation(
            subtotal = subtotal,
            discountAmount = discountAmount,
            taxableAmount = taxable,
            cgstRatePercent = cgstRatePercent,
            cgstAmount = cgst,
            sgstRatePercent = sgstRatePercent,
            sgstAmount = sgst,
            serviceChargePercent = serviceChargePercent,
            serviceChargeAmount = serviceCharge,
            roundOff = roundOff,
            grandTotal = roundedTotal
        )
    }
}
