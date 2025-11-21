
import { PrescriptionData, Medication } from '../types';

export const triggerPrint = () => {
  window.print();
};

export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePrescriptionCSV = (data: PrescriptionData): string => {
  const headers = [
    'Prescription ID',
    'Timestamp',
    'Patient Name',
    'Prescriber',
    'Medicine Name',
    'Strength',
    'Frequency',
    'Duration',
    'Verification Status',
    'Batch ID'
  ];

  const rows = data.medications.map(med => [
    data.id,
    data.timestamp,
    data.patient_name.value,
    data.prescriber.value,
    med.name_normalized,
    med.strength,
    med.frequency,
    med.duration,
    med.blockchain_check?.status || 'PENDING',
    med.blockchain_check?.batch_id || 'N/A'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};

export const generateAuditLogCSV = (days: number): string => {
  // Simulating a bulk export from backend logs
  const headers = ['Log ID', 'Timestamp', 'Event Type', 'Actor', 'Details', 'Status'];
  const rows = [];
  
  for (let i = 0; i < 20; i++) {
    rows.push([
      `LOG_${1000 + i}`,
      new Date(Date.now() - i * 86400000).toISOString(),
      i % 3 === 0 ? 'BATCH_VERIFICATION' : 'PRESCRIPTION_UPLOAD',
      i % 3 === 0 ? 'System' : 'Pharmacist_01',
      i % 5 === 0 ? 'Potential Counterfeit Detected' : 'Routine Operation',
      i % 5 === 0 ? 'FLAGGED' : 'SUCCESS'
    ]);
  }

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};
