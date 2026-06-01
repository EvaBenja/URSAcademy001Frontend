import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import { produitsService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProduitsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    produitsService.getAll()
      .then(res => setProducts(res.data))
      .catch(() => toast.error('Erreur chargement produits'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</div>;

  return (
    <>
      <PageHeader title="Produits" subtitle="Consultez le catalogue et les stocks disponibles." />
      <Table
        data={products}
        columns={[
          { key:'reference', label:'Référence' },
          { key:'nom',       label:'Produit' },
          { key:'prix_unitaire', label:'Prix (FCFA)', render:(row:any)=>new Intl.NumberFormat('fr-FR').format(row.prix_unitaire) },
          { key:'quantite_stock', label:'Stock', render:(row:any)=>(
            <span style={{ fontWeight:700, color:row.quantite_stock<10?'#ef4444':'#1465BB' }}>
              {row.quantite_stock} {row.quantite_stock<10 && <span style={{ fontSize:10, background:'#fef2f2', color:'#ef4444', padding:'1px 6px', borderRadius:6, marginLeft:4 }}>Bas</span>}
            </span>
          )},
          { key:'unite', label:'Unité', render:(row:any)=>row.unite||'—' },
        ]}
        searchKeys={['reference','nom']}
        pageSize={10}
      />
    </>
  );
}