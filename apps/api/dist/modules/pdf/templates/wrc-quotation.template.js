"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrcQuotationTemplate = void 0;
const wrcQuotationTemplate = (data) => {
    return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>Quotation ${data.documentNumber}</title>
      <style>
        body { font-family: 'Sarabun', sans-serif; font-size: 14px; margin: 0; padding: 0; }
        .container { width: 100%; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .company-info h1 { font-size: 24px; color: #d32f2f; margin: 0; }
        .quote-info { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .total-row td { font-weight: bold; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <h1>W.R.C. WIRE AND CABLE</h1>
            <p>123 Example Street, Bangkok 10110</p>
          </div>
          <div class="quote-info">
            <h2>ใบเสนอราคา / Quotation</h2>
            <p><strong>เลขที่:</strong> ${data.documentNumber || 'DRAFT'}</p>
            <p><strong>วันที่:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
          </div>
        </div>
        
        <div class="customer-info">
          <p><strong>ลูกค้า:</strong> ${data.customerName || 'ทั่วไป'}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รายการสินค้า</th>
              <th>จำนวน</th>
              <th>ราคาต่อหน่วย</th>
              <th>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">รวมเป็นเงิน</td>
              <td class="text-right">${data.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="4" class="text-right">ภาษีมูลค่าเพิ่ม 7%</td>
              <td class="text-right">${data.vat.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" class="text-right">จำนวนเงินรวมทั้งสิ้น</td>
              <td class="text-right">${data.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;
};
exports.wrcQuotationTemplate = wrcQuotationTemplate;
