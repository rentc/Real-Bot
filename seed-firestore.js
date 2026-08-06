const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize for emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
initializeApp({ projectId: 'wrc-ai-sales' });

const db = getFirestore();
const tenantId = 'tenant_wrc_main';

async function seed() {
  console.log('Seeding products...');
  const nyy4x6 = await db.collection('products').add({
    tenantId,
    sku: 'CAB-NYY-4X6',
    name: 'NYY 4x6 sq.mm.',
    category: 'CABLE',
    type: 'NYY',
    size: '4x6',
    isActive: true,
  });

  const vct2x25 = await db.collection('products').add({
    tenantId,
    sku: 'CAB-VCT-2X2.5',
    name: 'VCT 2x2.5 sq.mm.',
    category: 'CABLE',
    type: 'VCT',
    size: '2x2.5',
    isActive: true,
  });

  console.log('Seeding prices...');
  const priceBook = await db.collection('priceBooks').add({
    tenantId,
    name: 'Standard Retail 2026',
    isActive: true,
  });

  const version = await db.collection('priceBooks').doc(priceBook.id).collection('priceVersions').add({
    status: 'APPROVED',
    effectiveDate: new Date(),
  });

  await db.collection('priceBooks').doc(priceBook.id).collection('priceVersions').doc(version.id).collection('priceItems').add({
    productId: nyy4x6.id,
    price: 150.00,
  });

  await db.collection('priceBooks').doc(priceBook.id).collection('priceVersions').doc(version.id).collection('priceItems').add({
    productId: vct2x25.id,
    price: 45.50,
  });

  console.log('Seeding stock...');
  await db.collection('stockLevels').add({
    productId: nyy4x6.id,
    warehouseId: 'WH_BKK_01',
    quantity: 5000,
  });

  await db.collection('stockLevels').add({
    productId: vct2x25.id,
    warehouseId: 'WH_BKK_01',
    quantity: 12000,
  });

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(console.error);
