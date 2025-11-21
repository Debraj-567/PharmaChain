
import { DashboardMetrics, DateRange, GeoThreat, ThreatLevel } from '../types';

const generateDates = (days: number): string[] => {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0].slice(5)); // MM-DD
  }
  return dates;
};

export const getDashboardMetrics = async (range: DateRange, region: string = 'ALL'): Promise<DashboardMetrics> => {
  // Simulate API Latency
  await new Promise(resolve => setTimeout(resolve, 600));

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const dates = generateDates(days);

  // Generate Volume Data
  const volumeData = dates.map(date => ({
    date,
    valid: Math.floor(Math.random() * 50) + 100,
    flagged: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0
  }));

  // Generate Performance Data
  const performanceData = dates.map(date => ({
    date,
    ocrAccuracy: 90 + Math.random() * 9, // 90-99%
    automationRate: 80 + Math.random() * 15 // 80-95%
  }));

  // Generate Threat Origins
  const manufacturers = ['PharmaGlobal Ltd', 'MediSource Inc', 'BioTech Solutions', 'Unknown Origin', 'Generic Labs'];
  const threatOrigins = manufacturers.map(m => ({
    origin: m,
    count: Math.floor(Math.random() * 15)
  })).sort((a, b) => b.count - a.count);

  const totalPrescriptions = volumeData.reduce((acc, cur) => acc + cur.valid + cur.flagged, 0);
  const totalFlagged = volumeData.reduce((acc, cur) => acc + cur.flagged, 0);
  
  return {
    totalPrescriptions,
    approvalRate: Number(((1 - (totalFlagged / totalPrescriptions)) * 100).toFixed(1)),
    counterfeitIncidents: totalFlagged,
    lowStockItems: Math.floor(Math.random() * 20) + 5,
    volumeData,
    performanceData,
    threatOrigins
  };
};

export const getGlobalThreats = async (): Promise<GeoThreat[]> => {
  // Mock Global Data
  // In a real app, this would come from an on-chain indexer of "BatchFlagged" events with geolocation
  return [
    { id: 'NY', lat: 40.7128, lng: -74.0060, locationName: 'New York, USA', level: ThreatLevel.LOW, incidentCount: 12 },
    { id: 'LDN', lat: 51.5074, lng: -0.1278, locationName: 'London, UK', level: ThreatLevel.LOW, incidentCount: 5 },
    { id: 'MUM', lat: 19.0760, lng: 72.8777, locationName: 'Mumbai, India', level: ThreatLevel.MODERATE, incidentCount: 45 },
    { id: 'SHG', lat: 31.2304, lng: 121.4737, locationName: 'Shanghai, China', level: ThreatLevel.HIGH, incidentCount: 89 },
    { id: 'LAG', lat: 6.5244, lng: 3.3792, locationName: 'Lagos, Nigeria', level: ThreatLevel.HIGH, incidentCount: 67 },
    { id: 'SAO', lat: -23.5505, lng: -46.6333, locationName: 'Sao Paulo, Brazil', level: ThreatLevel.MODERATE, incidentCount: 32 },
    { id: 'IST', lat: 41.0082, lng: 28.9784, locationName: 'Istanbul, Turkey', level: ThreatLevel.MODERATE, incidentCount: 28 },
    { id: 'MOS', lat: 55.7558, lng: 37.6173, locationName: 'Moscow, Russia', level: ThreatLevel.HIGH, incidentCount: 55 },
    { id: 'JHB', lat: -26.2041, lng: 28.0473, locationName: 'Johannesburg, SA', level: ThreatLevel.LOW, incidentCount: 8 },
    { id: 'SYD', lat: -33.8688, lng: 151.2093, locationName: 'Sydney, Australia', level: ThreatLevel.LOW, incidentCount: 2 },
  ];
};