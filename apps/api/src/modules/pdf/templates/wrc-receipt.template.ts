export const wrcReceiptTemplate = (data: any): string => {
  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${data.documentNumber}</title>
      <style>
        body { font-family: 'Sarabun', sans-serif; font-size: 14px; margin: 0; padding: 0; }
        .container { width: 100%; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .company-info h1 { font-size: 24px; color: #2e7d32; margin: 0; }
        .quote-info { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .total-row td { font-weight: bold; }
        .text-right { text-align: right; }
        .status-stamp { color: #d32f2f; font-size: 24px; font-weight: bold; margin-top: 20px; text-align: center; border: 3px solid #d32f2f; display: inline-block; padding: 10px; transform: rotate(-10deg); }
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
            <h2>ใบเสร็จรับเงิน / Receipt</h2>
            <p><strong>เลขที่:</strong> ${data.documentNumber}</p>
            <p><strong>วันที่:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
            <p><strong>อ้างอิงใบสั่งซื้อ:</strong> ${data.orderNumber}</p>
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
            ${(data.items || []).map((item: any, index: number) => `
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
              <td class="text-right">${(data.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="4" class="text-right">ภาษีมูลค่าเพิ่ม 7%</td>
              <td class="text-right">${(data.vat || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" class="text-right">จำนวนเงินรวมทั้งสิ้น</td>
              <td class="text-right">${(data.total || 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align: center; margin-top: 40px;">
           <div class="status-stamp">PAID / ชำระเงินแล้ว</div>
        </div>
      </div>
    </body>
    </html>
  `;
};
