export const PRODUCTS = [
  { id: 'water', label: 'Water', cost: 0.45, baseDemand: 90, initialPrice: 1.5, capacity: 140, elasticity: 1.35 },
  { id: 'cola', label: 'Cola', cost: 0.7, baseDemand: 70, initialPrice: 2, capacity: 110, elasticity: 1.55 },
  { id: 'chips', label: 'Chips', cost: 0.6, baseDemand: 55, initialPrice: 1.8, capacity: 90, elasticity: 1.05 }
];

export const SCENARIOS = {
  'normal-market': { id: 'normal-market', label: 'Normal Market', signal: () => 'Demand is stable.' },
  heatwave: { id: 'heatwave', label: 'Heatwave', signal: week => week >= 4 && week < 8 ? 'Public heatwave alert is active.' : week === 8 ? 'The heatwave alert has ended.' : 'No weather shock is active.' },
  'price-war': { id: 'price-war', label: 'Price War', signal: week => week >= 4 && week < 8 ? 'A competitor cut water and cola prices by 30%.' : week === 8 ? 'The competitor restored normal prices.' : 'Competitor prices are stable.' }
};

export function scenarioMultipliers(id, week, productId) {
  if (id === 'heatwave' && week >= 4 && week < 8) return productId === 'chips' ? 0.85 : 1.65;
  return 1;
}

export function competitorPrice(id, week, product) {
  if (id === 'price-war' && week >= 4 && week < 8 && product.id !== 'chips') return product.initialPrice * 0.7;
  return product.initialPrice;
}
