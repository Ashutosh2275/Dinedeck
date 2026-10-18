// 🖨️ DINEDECK DIRECT THERMAL PRINTER UTILITY (80mm / 3-INCH CONTINUOUS RECEIPT ROLL)
// Generates industry-standard, high-contrast POS receipts formatted for Indian Restaurants (Epson/TVS/Citizen/Posiflex/thermal roll printers)

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface TaxInvoicePrintData {
  restaurantName?: string;
  tagline?: string;
  address?: string;
  gstin?: string;
  fssaiLicense?: string;
  phone?: string;
  invoiceNumber: string;
  dateStr?: string;
  tableNumber: string;
  floor?: string;
  guestCount?: number;
  serverName?: string;
  cashierName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount?: number;
  discountPercent?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  serviceCharge?: number;
  roundOff?: number;
  grandTotal: number;
  paymentMethod?: string;
  paymentRef?: string;
  status?: string;
}

export interface KitchenKOTPrintData {
  kotNumber: string | number;
  tableNumber: string;
  floor?: string;
  serverName?: string;
  orderTime?: string;
  orderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ROOM_SERVICE';
  station?: string;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
    customization?: string;
  }>;
  specialInstructions?: string;
}

export interface MandiProcurementPrintData {
  dateStr: string;
  restaurantName?: string;
  supplierName?: string;
  items: Array<{
    name: string;
    orderQty: number;
    unit: string;
    shelfBalance?: number;
    costPerUnit?: number;
    estimatedCost?: number;
  }>;
  totalEstimatedCost: number;
}

export interface DailySalesPrintData {
  restaurantName?: string;
  dateStr: string;
  shiftName?: string;
  totalOrders: number;
  guestCount: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  cgstCollected: number;
  sgstCollected: number;
  serviceCharge: number;
  grandTotalCollected: number;
  paymentBreakdown: {
    upi: number;
    card: number;
    cash: number;
  };
}

/**
 * Injects receipt HTML into the dedicated DOM print container and fires direct print
 */
function executeDirectThermalPrint(receiptHTML: string) {
  // If running in DineDeck Windows Desktop App, use native Electron direct print
  if (typeof window !== 'undefined' && (window as any).dinedeckDesktop?.printReceipt) {
    (window as any).dinedeckDesktop.printReceipt({ html: receiptHTML, silent: false }).catch((err: any) => {
      console.warn('Native thermal print failed, falling back to standard print:', err);
      fallbackWebPrint(receiptHTML);
    });
    return;
  }

  fallbackWebPrint(receiptHTML);
}

function fallbackWebPrint(receiptHTML: string) {
  let target = document.getElementById('dinedeck-thermal-print-target');
  if (!target) {
    target = document.createElement('div');
    target.id = 'dinedeck-thermal-print-target';
    document.body.appendChild(target);
  }

  target.innerHTML = receiptHTML;

  // Direct trigger without confirmation modal interference
  setTimeout(() => {
    window.print();
  }, 50);
}

/**
 * 🧾 Print Customer GST Tax Invoice (80mm Thermal Receipt)
 */
export function printTaxInvoice(data: TaxInvoicePrintData) {
  const restName = data.restaurantName || 'THE PUNJAB HERITAGE';
  const address = data.address || 'BKC Flagship, G-Block, Bandra Kurla Complex, Mumbai';
  const gstin = data.gstin || '27AABCU9603R1ZM';
  const fssai = data.fssaiLicense || '11522001000452';
  const phone = data.phone || '+91 98200 44556';
  const dateStr = data.dateStr || new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  const server = data.serverName || 'Harpreet Singh';
  const cashier = data.cashierName || 'Cashier Desk 01';

  const subtotal = data.subtotal;
  const discount = data.discountAmount || 0;
  const taxable = data.taxableAmount || (subtotal - discount);
  const cgst = data.cgstAmount || (taxable * 0.025);
  const sgst = data.sgstAmount || (taxable * 0.025);
  const service = data.serviceCharge || (taxable * 0.05);
  const grandTotal = data.grandTotal;

  let itemsHTML = '';
  data.items.forEach((item) => {
    itemsHTML += `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 3px; font-weight: bold;">
        <div style="flex: 1; min-width: 0; padding-right: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</div>
        <div style="width: 24px; text-align: center;">${item.quantity}</div>
        <div style="width: 48px; text-align: right;">${item.unitPrice.toFixed(0)}</div>
        <div style="width: 54px; text-align: right;">${item.totalPrice.toFixed(0)}</div>
      </div>
      ${item.notes ? `<div style="font-size: 9px; font-style: italic; color: #333; margin-left: 4px;">* ${item.notes}</div>` : ''}
    `;
  });

  const html = `
    <div style="width: 74mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.25; padding: 2px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 4px;">
        <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">${restName}</div>
        <div style="font-size: 9.5px; margin-top: 1px;">${address}</div>
        <div style="font-size: 9.5px;">Tel: ${phone}</div>
        <div style="font-size: 9.5px; font-weight: bold; margin-top: 2px;">GSTIN: ${gstin}</div>
        <div style="font-size: 9.5px;">FSSAI Lic: ${fssai}</div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 3px 0;"></div>

      <div style="text-align: center; font-weight: 900; font-size: 12px; letter-spacing: 1px;">TAX INVOICE</div>

      <div style="border-top: 1px dashed #000; margin: 3px 0;"></div>

      <!-- Bill Metadata -->
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Bill #: <b>${data.invoiceNumber}</b></span>
        <span>Date: <b>${dateStr}</b></span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between; margin-top: 2px;">
        <span>Table: <b>Table #${data.tableNumber}${data.floor ? ` (${data.floor})` : ''}</b></span>
        <span>Pax: <b>${data.guestCount || 2} Guests</b></span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between; margin-top: 2px;">
        <span>Server: <b>${server}</b></span>
        <span>Cashier: <b>${cashier}</b></span>
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0 2px 0;"></div>

      <!-- Item Table Header -->
      <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px;">
        <div style="flex: 1;">ITEM DESCRIPTION</div>
        <div style="width: 24px; text-align: center;">QTY</div>
        <div style="width: 48px; text-align: right;">RATE</div>
        <div style="width: 54px; text-align: right;">AMOUNT</div>
      </div>

      <!-- Items List -->
      <div style="margin-bottom: 4px;">
        ${itemsHTML}
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <!-- Calculation Breakdown -->
      <div style="font-size: 10.5px;">
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>Item Subtotal:</span>
          <span>₹${subtotal.toFixed(2)}</span>
        </div>

        ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-top: 1px; font-weight: bold;">
            <span>Discount ${data.discountPercent ? `(${data.discountPercent}%)` : ''}:</span>
            <span>-₹${discount.toFixed(2)}</span>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>Taxable Value:</span>
          <span>₹${taxable.toFixed(2)}</span>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>CGST (2.5%):</span>
          <span>₹${cgst.toFixed(2)}</span>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>SGST (2.5%):</span>
          <span>₹${sgst.toFixed(2)}</span>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>Service Charge (5%):</span>
          <span>₹${service.toFixed(2)}</span>
        </div>
      </div>

      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 4px 0; display: flex; justify-content: space-between; font-size: 14px; font-weight: 900;">
        <span>NET AMOUNT:</span>
        <span>₹${grandTotal.toFixed(2)}</span>
      </div>

      <!-- Payment Settlement Details -->
      <div style="font-size: 10px; margin-top: 4px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Payment Mode:</span>
          <span style="font-weight: 900;">${data.paymentMethod || 'UPI / ONLINE'}</span>
        </div>
        ${data.paymentRef ? `
          <div style="display: flex; justify-content: space-between; margin-top: 1px;">
            <span>Ref/Challan #:</span>
            <span>${data.paymentRef}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>Bill Settlement:</span>
          <span style="font-weight: 900;">${data.status || 'PAID & CLOSED'}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 6px 0 4px 0;"></div>

      <!-- Footer Greeting -->
      <div style="text-align: center; font-size: 10px; font-weight: bold;">
        <div>*** THANK YOU! VISIT AGAIN ***</div>
        <div style="font-size: 8.5px; font-weight: normal; margin-top: 2px;">Prices inclusive of applicable GST taxes</div>
        <div style="font-size: 8.5px; font-weight: normal;">Powered by DineDeck POS</div>
      </div>
      <div style="text-align: center; margin-top: 6px; font-size: 8px;">- - - - - - - - - - - - - - - - - - - -</div>
    </div>
  `;

  executeDirectThermalPrint(html);
}

/**
 * 👨‍🍳 Print Kitchen Order Ticket (KOT) (80mm Thermal Receipt)
 */
export function printKitchenKOT(data: KitchenKOTPrintData) {
  const dateStr = data.orderTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const server = data.serverName || 'Harpreet';

  let itemsHTML = '';
  data.items.forEach((item) => {
    itemsHTML += `
      <div style="margin-top: 4px; padding-bottom: 2px; border-bottom: 1px dotted #888;">
        <div style="display: flex; align-items: baseline; font-size: 13px; font-weight: 900;">
          <span style="display: inline-block; width: 32px; font-size: 15px; color: #000;">${item.quantity}x</span>
          <span style="flex: 1;">${item.name}</span>
        </div>
        ${item.customization ? `<div style="font-size: 10.5px; font-weight: bold; margin-left: 32px; color: #111;">↳ [${item.customization}]</div>` : ''}
        ${item.notes ? `<div style="font-size: 10px; font-style: italic; margin-left: 32px; color: #222;">Note: ${item.notes}</div>` : ''}
      </div>
    `;
  });

  const html = `
    <div style="width: 74mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.25; padding: 2px;">
      <div style="text-align: center; font-size: 15px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 3px 0; margin-bottom: 4px;">
        *** KITCHEN ORDER TICKET ***
      </div>

      <div style="font-size: 14px; font-weight: 900; text-align: center; margin-bottom: 4px;">
        KOT #: ${data.kotNumber}
      </div>

      <div style="border-top: 1px dashed #000; margin: 3px 0;"></div>

      <div style="font-size: 12px; font-weight: 900; display: flex; justify-content: space-between;">
        <span>TABLE: #${data.tableNumber}${data.floor ? ` (${data.floor})` : ''}</span>
        <span>${data.orderType || 'DINE-IN'}</span>
      </div>

      <div style="font-size: 10px; display: flex; justify-content: space-between; margin-top: 2px;">
        <span>Time: <b>${dateStr}</b></span>
        <span>Server: <b>${server}</b></span>
      </div>

      ${data.station ? `<div style="font-size: 10.5px; font-weight: bold; margin-top: 2px;">Station: <b>${data.station}</b></div>` : ''}

      <div style="border-top: 2px solid #000; margin: 4px 0 3px 0;"></div>

      <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; padding-bottom: 1px;">
        <span style="width: 32px;">QTY</span>
        <span style="flex: 1;">ITEM & KITCHEN INSTRUCTIONS</span>
      </div>

      <div style="border-top: 1px solid #000; margin-bottom: 3px;"></div>

      <div>
        ${itemsHTML}
      </div>

      ${data.specialInstructions ? `
        <div style="margin-top: 6px; padding: 4px; border: 1px dashed #000; font-size: 10px; font-weight: bold;">
          SPECIAL CHEF INSTRUCTION: ${data.specialInstructions}
        </div>
      ` : ''}

      <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 4px; text-align: center; font-size: 9px;">
        === END OF KOT #${data.kotNumber} ===
      </div>
      <div style="text-align: center; margin-top: 6px; font-size: 8px;">- - - - - - - - - - - - - - - - - - - -</div>
    </div>
  `;

  executeDirectThermalPrint(html);
}

/**
 * 📦 Print Next-Day Mandi Restock & Procurement Sheet (80mm Thermal Receipt)
 */
export function printMandiProcurementSlip(data: MandiProcurementPrintData) {
  let rowsHTML = '';
  data.items.forEach((item) => {
    rowsHTML += `
      <div style="margin-top: 4px; padding-bottom: 2px; border-bottom: 1px dotted #aaa;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
          <span style="flex: 1; padding-right: 4px;">${item.name}</span>
          <span style="font-size: 12px; font-weight: 900; width: 60px; text-align: right;">${item.orderQty.toFixed(1)} ${item.unit}</span>
        </div>
        ${item.shelfBalance !== undefined ? `
          <div style="font-size: 9.5px; color: #444; display: flex; justify-content: space-between;">
            <span>Shelf: ${item.shelfBalance.toFixed(1)} ${item.unit}</span>
            <span>Est: ₹${(item.estimatedCost || 0).toFixed(0)}</span>
          </div>
        ` : ''}
      </div>
    `;
  });

  const html = `
    <div style="width: 74mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.25; padding: 2px;">
      <div style="text-align: center; margin-bottom: 4px;">
        <div style="font-size: 13px; font-weight: 900; text-transform: uppercase;">${data.restaurantName || 'THE PUNJAB HERITAGE'}</div>
        <div style="font-size: 11px; font-weight: 900; margin-top: 2px;">MORNING MANDI PROCUREMENT SLIP</div>
        <div style="font-size: 9.5px; margin-top: 1px;">Delivery Date: <b>${data.dateStr} (07:00 AM)</b></div>
        ${data.supplierName ? `<div style="font-size: 9.5px;">Vendor: <b>${data.supplierName}</b></div>` : ''}
      </div>

      <div style="border-top: 1px dashed #000; margin: 3px 0;"></div>

      <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px;">
        <span>RAW INGREDIENT</span>
        <span>ORDER QTY</span>
      </div>

      <div>
        ${rowsHTML}
      </div>

      <div style="border-top: 2px solid #000; margin-top: 6px; padding-top: 4px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 900;">
        <span>EST. TOTAL BUDGET:</span>
        <span>₹${data.totalEstimatedCost.toLocaleString('en-IN')}</span>
      </div>

      <div style="margin-top: 12px; font-size: 9px; space-y: 6px;">
        <div style="margin-bottom: 8px;">Delivery Received By: ___________________</div>
        <div>Storekeeper Signature: __________________</div>
      </div>

      <div style="text-align: center; margin-top: 10px; font-size: 8px;">- - - - - - - - - - - - - - - - - - - -</div>
    </div>
  `;

  executeDirectThermalPrint(html);
}

/**
 * 📊 Print Daily Sales Summary Slip (80mm Thermal Receipt)
 */
export function printDailySalesReport(data: DailySalesPrintData) {
  const html = `
    <div style="width: 74mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.25; padding: 2px;">
      <div style="text-align: center; margin-bottom: 4px;">
        <div style="font-size: 13px; font-weight: 900; text-transform: uppercase;">${data.restaurantName || 'THE PUNJAB HERITAGE'}</div>
        <div style="font-size: 11px; font-weight: 900; margin-top: 2px;">DAILY SALES & TAX RECONCILIATION</div>
        <div style="font-size: 9.5px; margin-top: 1px;">Date: <b>${data.dateStr}</b></div>
        <div style="font-size: 9.5px;">Shift: <b>${data.shiftName || 'Lunch & Dinner'}</b></div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 3px 0;"></div>

      <div style="font-size: 10.5px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Total Orders Settled:</span>
          <b>${data.totalOrders}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>Total Guests Served:</span>
          <b>${data.guestCount}</b>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <div style="font-size: 10.5px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Gross Food Sales:</span>
          <span>₹${data.grossSales.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>Discounts Given:</span>
          <span>-₹${data.discounts.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px; font-weight: bold;">
          <span>Net Food Sales:</span>
          <span>₹${data.netSales.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>CGST (2.5%):</span>
          <span>₹${data.cgstCollected.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>SGST (2.5%):</span>
          <span>₹${data.sgstCollected.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>Service Charge (5%):</span>
          <span>₹${data.serviceCharge.toFixed(2)}</span>
        </div>
      </div>

      <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 4px 0; display: flex; justify-content: space-between; font-size: 13px; font-weight: 900;">
        <span>TOTAL REVENUE:</span>
        <span>₹${data.grandTotalCollected.toFixed(2)}</span>
      </div>

      <div style="font-size: 10px; margin-top: 4px;">
        <div style="font-weight: bold; margin-bottom: 2px;">PAYMENT BREAKDOWN:</div>
        <div style="display: flex; justify-content: space-between;">
          <span>• UPI / Digital:</span>
          <b>₹${data.paymentBreakdown.upi.toFixed(2)}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>• Card POS:</span>
          <b>₹${data.paymentBreakdown.card.toFixed(2)}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 1px;">
          <span>• Cash Drawer:</span>
          <b>₹${data.paymentBreakdown.cash.toFixed(2)}</b>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px 0 4px 0;"></div>
      <div style="text-align: center; font-size: 9px; font-weight: bold;">
        Shift Closed By Manager
      </div>
      <div style="text-align: center; margin-top: 6px; font-size: 8px;">- - - - - - - - - - - - - - - - - - - -</div>
    </div>
  `;

  executeDirectThermalPrint(html);
}
