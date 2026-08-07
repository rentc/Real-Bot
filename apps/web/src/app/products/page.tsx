import { fetchProducts } from '@/lib/api';

export default async function Products() {
  const products = await fetchProducts();

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', fontWeight: 700 }}>
        Product <span className="text-gradient">Catalog</span>
      </h1>
      
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <input type="text" className="input-premium" placeholder="Search products..." style={{ width: '300px' }} />
        <button className="btn-primary">Add Product</button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
        {products.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No products found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>SKU</th>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Brand</th>
                <th style={{ padding: '12px' }}>Price (THB)</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => (
                <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{product.sku}</td>
                  <td style={{ padding: '12px' }}>{product.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{product.brand}</td>
                  <td style={{ padding: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>
                    ฿{product.price?.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      background: product.isActive ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: product.isActive ? 'var(--accent-green)' : 'var(--text-secondary)'
                    }}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
