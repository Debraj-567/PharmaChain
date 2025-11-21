import { AlternativeMedicine } from '../types';

// Mock database of alternatives
const MOCK_DB: Record<string, AlternativeMedicine[]> = {
  default: [
    {
      medicine_id: 'med_gen_001',
      brand: 'Generic Amoxicillin',
      generic_name: 'Amoxicillin',
      same_api: true,
      equivalence_score: 1.0,
      estimated_price: 8.50,
      currency: 'USD',
      in_stock: true,
      manufacturer: 'HealthCorp Generics',
      form: 'Tablet'
    },
    {
      medicine_id: 'med_brand_002',
      brand: 'Amoxil',
      generic_name: 'Amoxicillin',
      same_api: true,
      equivalence_score: 1.0,
      estimated_price: 24.00,
      currency: 'USD',
      in_stock: true,
      manufacturer: 'BigPharma Inc.',
      form: 'Tablet'
    },
    {
      medicine_id: 'med_alt_003',
      brand: 'Augmentin',
      generic_name: 'Amoxicillin / Clavulanate',
      same_api: false,
      equivalence_score: 0.92,
      estimated_price: 35.00,
      currency: 'USD',
      in_stock: false,
      manufacturer: 'Global Meds',
      form: 'Tablet'
    }
  ]
};

export const getAlternatives = async (medicineName: string): Promise<AlternativeMedicine[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const results = MOCK_DB['default'].map(m => ({
    ...m,
    // Dynamic updates for variety
    in_stock: Math.random() > 0.15,
    estimated_price: Number((m.estimated_price * (0.9 + Math.random() * 0.2)).toFixed(2))
  }));
  
  // Simple logic to vary results based on name (simulation)
  if (medicineName.toLowerCase().includes('stat')) {
      return results.map(r => ({...r, generic_name: 'Atorvastatin', brand: r.brand.replace('Amox', 'Lipit')}));
  }

  return results.sort((a, b) => {
    // Sort by Equivalence (desc), then Stock (true first), then Price (asc)
    if (b.equivalence_score !== a.equivalence_score) return b.equivalence_score - a.equivalence_score;
    if (b.in_stock !== a.in_stock) return b.in_stock ? 1 : -1;
    return a.estimated_price - b.estimated_price;
  });
};