import { bahttext } from 'bahttext';

export const wrcQuotationTemplate = (data: any): string => {
  const documentNumber = data.documentNumber || 'DRAFT';
  const customerName = data.customerName || 'ทั่วไป';
  const items = data.items || [];
  const subtotal = data.subtotal || 0;
  const vat = data.vat || 0;
  const total = data.total || 0;
  
  const formattedSubtotal = subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedVat = vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const today = new Date().toLocaleDateString('th-TH');
  
  // Fill empty rows to make the table look complete if there are few items
  const minRows = 8;
  const emptyRowsCount = Math.max(0, minRows - items.length);
  const emptyRows = Array(emptyRowsCount).fill('').map(() => `
    <tr>
      <td style="height: 28px;"></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>Quotation ${documentNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        body { 
          font-family: 'Sarabun', sans-serif; 
          font-size: 13px; 
          margin: 0; 
          padding: 0; 
          color: #000; 
          background: #fff;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .container { width: 100%; max-width: none; border: none; padding: 0; }
        }
        .container { 
          width: 100%; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
          box-sizing: border-box; 
        }
        .header-top { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 15px; 
        }
        .company-info { flex: 1.5; }
        .company-name { font-size: 22px; font-weight: bold; margin: 0 0 5px 0; }
        .company-address { font-size: 12px; line-height: 1.4; margin-bottom: 5px; }
        .logo-placeholder { 
          flex: 1; 
          text-align: center; 
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo-inner {
          border: 2px solid #5c7cfa; 
          border-radius: 50%; 
          width: 140px; 
          height: 60px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          color: #5c7cfa; 
          font-size: 24px;
        }
        .doc-title-container { flex: 1; text-align: right; }
        .doc-title { font-size: 24px; font-weight: bold; margin: 0; }
        .page-num { font-size: 11px; margin-top: 5px; }
        .qr-placeholder { 
          width: 50px; 
          height: 50px; 
          border: 1px solid #000; 
          display: inline-block; 
          margin-top: 10px; 
          line-height: 50px; 
          text-align: center; 
          font-size: 9px;
          background: #f0f0f0;
        }
        
        .info-boxes { display: flex; gap: 10px; margin-bottom: 15px; }
        .info-box { 
          border: 1px solid #000; 
          border-radius: 6px; 
          padding: 10px; 
          flex: 1; 
        }
        .info-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .info-table td { padding: 3px 0; vertical-align: top; }
        .info-label { font-weight: bold; width: 80px; }
        
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          border: 1px solid #000; 
        }
        .items-table th, .items-table td { 
          border-left: 1px solid #000; 
          border-right: 1px solid #000; 
          padding: 6px; 
        }
        .items-table th { 
          border-bottom: 1px solid #000; 
          text-align: center; 
          font-weight: bold; 
          padding: 10px 6px;
        }
        .items-table td { vertical-align: top; }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .footer-wrapper { border: 1px solid #000; border-top: none; display: flex; }
        .footer-left { flex: 1.5; border-right: 1px solid #000; display: flex; flex-direction: column; }
        .baht-text { 
          font-weight: bold; 
          border-bottom: 1px solid #000; 
          padding: 8px; 
          text-align: center; 
          font-size: 13px;
        }
        .terms { padding: 10px; font-size: 12px; line-height: 1.5; }
        
        .footer-right { flex: 1; padding: 8px; }
        .summary-table { width: 100%; border-collapse: collapse; font-size: 13px; font-weight: bold; }
        .summary-table td { padding: 4px 0; }
        
        .signatures { display: flex; justify-content: space-between; gap: 10px; margin-top: 20px; }
        .sig-box { 
          border: 1px solid #000; 
          border-radius: 8px; 
          padding: 10px; 
          flex: 1; 
          text-align: center; 
          height: 90px; 
          position: relative; 
        }
        .sig-title { font-weight: bold; font-size: 12px; }
        .sig-line { position: absolute; bottom: 35px; left: 15px; right: 15px; border-bottom: 1px dotted #000; }
        .sig-date { position: absolute; bottom: 10px; left: 15px; right: 15px; text-align: left; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        
        <div class="header-top">
          <div class="company-info">
            <h1 class="company-name">บริษัท วรรณ์รัฐชาติ วิศวกรรม จำกัด</h1>
            <div class="company-address">
              80 ซอยวัดสุขใจ 24 แขวงทรายกองดิน เขตคลองสามวา กรุงเทพมหานคร 10510<br>
              <strong>โทรศัพท์ :</strong> 02-088-6193, 065-593-9442 (ฝ่ายขาย) หรือ 02-020-6193 (ฝ่ายบัญชี)<br>
              <strong>Email :</strong> wanratchart.engineering@gmail.com<br>
              <strong>เลขประจำตัวผู้เสียภาษีอากร :</strong> 0105560156077<br>
              สถานประกอบการ [ X ] สำนักงานใหญ่ [ &nbsp;&nbsp; ] สาขาที่ 00000
            </div>
          </div>
          <div class="logo-placeholder">
            <div class="logo-inner">W.R.C</div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">ใบเสนอราคา</h1>
            <div class="page-num">หน้า 1 / 1</div>
            <div class="qr-placeholder">QR Code</div>
          </div>
        </div>
        
        <div class="info-boxes">
          <div class="info-box">
            <table class="info-table">
              <tr>
                <td class="info-label" style="width: 60px;">รหัสลูกค้า :</td>
                <td>H-0000 (Placeholder)</td>
              </tr>
              <tr>
                <td class="info-label">นามลูกค้า :</td>
                <td><strong>${customerName}</strong></td>
              </tr>
              <tr>
                <td class="info-label">ที่อยู่ :</td>
                <td>-</td>
              </tr>
              <tr>
                <td class="info-label">โทรศัพท์ :</td>
                <td>-</td>
              </tr>
            </table>
          </div>
          <div class="info-box" style="flex: 0.6;">
            <table class="info-table">
              <tr>
                <td class="info-label" style="width: 70px;">วันที่ :</td>
                <td>${today}</td>
              </tr>
              <tr>
                <td class="info-label">เลขที่เอกสาร :</td>
                <td>${documentNumber}</td>
              </tr>
              <tr>
                <td class="info-label">พนักงานขาย :</td>
                <td>Siripong</td>
              </tr>
              <tr>
                <td class="info-label">กำหนดชำระ :</td>
                <td>0 วัน</td>
              </tr>
              <tr>
                <td class="info-label">ครบกำหนด :</td>
                <td>${today}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="text-align: center; font-weight: bold; margin-bottom: 15px; font-size: 14px;">
          บริษัทฯ มีความยินดีขอเสนอราคา และ รายละเอียดของสินค้าตามรายการดังต่อไปนี้<br>
          <span style="font-size: 12px; font-weight: normal;">We take pleasure in quoting the following products with price and specification.</span>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">ลำดับ<br><span style="font-weight:normal;font-size:11px;">No.</span></th>
              <th style="width: 15%;">รหัสสินค้า<br><span style="font-weight:normal;font-size:11px;">Code</span></th>
              <th style="width: 35%;">รายละเอียด<br><span style="font-weight:normal;font-size:11px;">Description</span></th>
              <th style="width: 10%;">จำนวน<br><span style="font-weight:normal;font-size:11px;">Qty.</span></th>
              <th style="width: 12%;">ราคาต่อหน่วย<br><span style="font-weight:normal;font-size:11px;">Unit</span></th>
              <th style="width: 8%;">ส่วนลด<br><span style="font-weight:normal;font-size:11px;">Discount</span></th>
              <th style="width: 15%;">จำนวนเงิน<br><span style="font-weight:normal;font-size:11px;">Amount</span></th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any, index: number) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td class="text-center">${item.code || '-'}</td>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right">${item.discount || ''}</td>
                <td class="text-right">${(item.quantity * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
            ${emptyRows}
          </tbody>
        </table>
        
        <div class="footer-wrapper">
          <div class="footer-left">
            <div class="baht-text">
              (${bahttext(total)})
            </div>
            <div class="terms">
              - กำหนดยืนราคา 7 วัน นับตั้งแต่วันที่ระบุในใบเสนอราคาฉบับนี้<br>
              - กรุณาลงนามในช่อง "ผู้สั่งซื้อสินค้า" พร้อมประทับตรา (ถ้ามี) เพื่อยืนยันการสั่งซื้อ<br>
              &nbsp;&nbsp;และ ส่งกลับมายังบริษัทฯ เพื่อดำเนินการจัดส่งสินค้าให้ ภายใน ............. วัน
            </div>
          </div>
          <div class="footer-right">
            <table class="summary-table">
              <tr>
                <td>มูลค่าสินค้า</td>
                <td class="text-right">${formattedSubtotal}</td>
              </tr>
              <tr>
                <td>มูลค่าส่วนลด</td>
                <td class="text-right">-</td>
              </tr>
              <tr>
                <td>มูลค่าหลังส่วนลด</td>
                <td class="text-right">${formattedSubtotal}</td>
              </tr>
              <tr>
                <td>ภาษีมูลค่าเพิ่ม 7%</td>
                <td class="text-right">${formattedVat}</td>
              </tr>
              <tr>
                <td>รวมเงินทั้งสิ้น</td>
                <td class="text-right">${formattedTotal}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">ผู้สั่งซื้อสินค้า</div>
            <div class="sig-line"></div>
            <div class="sig-date">วันที่ ......../......../........</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">ผู้เสนอราคา</div>
            <div class="sig-line"></div>
            <div class="sig-date">วันที่ ......../......../........</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">ผู้ตรวจสอบ</div>
            <div class="sig-line"></div>
            <div class="sig-date">วันที่ ......../......../........</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">ผู้อนุมัติ</div>
            <div class="sig-line"></div>
            <div class="sig-date">วันที่ ......../......../........</div>
          </div>
        </div>
        
      </div>
    </body>
    </html>
  `;
};
