import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function VendeurProduitsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Appel direct /produits-liste — accessible au vendeur sans 403
    api.get('/produits-liste')
      .then(res => setProducts(res.data || []))
      .catch(() => toast.error('Erreur chargement produits'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement des produits…
    </div>
  );

  return (
    <>
      <PageHeader
        title="Catalogue Produits"
        subtitle={`${products.length} produit${products.length>1?'s':''} disponible${products.length>1?'s':''} — ajoutés par le gestionnaire`}
      />
      <Table
        data={products}
        columns={[
          { key:'reference', label:'Référence' },
          {
            key:'nom',
            label:'Produit',
            render:(row:any) => (
              <span style={{ fontWeight:600, color:'#0d1b3e' }}>{row.nom}</span>
            ),
          },
          {
            key:'prix_unitaire',
            label:'Prix unitaire (FCFA)',
            render:(row:any) => (
              <span style={{ fontWeight:700, color:'#1465BB' }}>
                {new Intl.NumberFormat('fr-FR').format(row.prix_unitaire)}
              </span>
            ),
          },
          {
            key:'quantite_stock',
            label:'Stock',
            render:(row:any) => (
              <span style={{ fontWeight:700, color:row.quantite_stock < 10 ? '#ef4444' : '#0a9e6e' }}>
                {row.quantite_stock}
                {row.quantite_stock === 0 && (
                  <span style={{ fontSize:10, background:'#fee2e2', color:'#ef4444', padding:'1px 6px', borderRadius:6, marginLeft:6, fontWeight:700 }}>
                    RUPTURE
                  </span>
                )}
                {row.quantite_stock > 0 && row.quantite_stock < 10 && (
                  <span style={{ fontSize:10, background:'#fef9c3', color:'#854d0e', padding:'1px 6px', borderRadius:6, marginLeft:6, fontWeight:700 }}>
                    BAS
                  </span>
                )}
              </span>
            ),
          },
          {
            key:'unite',
            label:'Unité',
            render:(row:any) => <span style={{ color:'#8a96b0' }}>{row.unite||'—'}</span>,
          },
        ]}
        searchKeys={['reference','nom']}
        pageSize={15}
        emptyText="Aucun produit disponible — contactez le gestionnaire"
      />
    </>
  );
}
