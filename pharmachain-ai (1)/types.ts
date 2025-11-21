
export enum BatchStatus {
  VERIFIED = 'VERIFIED',
  FLAGGED = 'FLAGGED',
  EXPIRED = 'EXPIRED',
  UNKNOWN = 'UNKNOWN'
}

export interface LifecycleEvent {
  timestamp: string;
  actor: string;
  action: string;
  location: string;
  txHash: string;
}

export interface IPFSMetadata {
  productName: string;
  batchId: string;
  manufactureDate: string;
  facilityId: string;
  inspectorSignature: string;
  coaUrl: string; // Certificate of Analysis
  ingredients: string[];
}

export interface BatchInfo {
  batch_id: string;
  status: BatchStatus;
  origin: string;
  expiryDate: string;
  tx_hash: string;
  ipfs_hash?: string; // The decentralized pointer
  events: LifecycleEvent[];
}

export interface CatalogMatch {
  medicine_id: string;
  brand: string;
  score: number;
}

export interface Medication {
  id: string;
  raw_text: string;
  name_normalized: string;
  strength: string;
  form: string;
  frequency: string;
  duration: string;
  catalog_matches: CatalogMatch[];
  ocr_confidence: number;
  entity_confidence: number;
  blockchain_check?: BatchInfo;
}

export interface AlternativeMedicine {
  medicine_id: string;
  brand: string;
  generic_name: string;
  same_api: boolean;
  equivalence_score: number; // 0-1
  estimated_price: number;
  currency: string;
  in_stock: boolean;
  manufacturer: string;
  form: string;
}

export enum InteractionSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface DrugInteraction {
  pair: string[];
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

export interface PatientInfo {
  value: string;
  confidence: number;
}

export interface PrescriberInfo {
  value: string;
  confidence: number;
}

export enum NFTStatus {
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  INVALID = 'INVALID'
}

export interface PrescriptionNFT {
  tokenId: string;
  contractAddress: string;
  owner: string; // Soulbound to patient wallet/ID
  status: NFTStatus;
  mintTimestamp: string;
}

export interface PrescriptionData {
  id: string;
  patient_name: PatientInfo;
  prescriber: PrescriberInfo;
  medications: Medication[];
  warnings: string[];
  timestamp: string;
  imageUrl?: string;
  nft?: PrescriptionNFT;
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  REVIEW = 'REVIEW',
  VERIFY = 'VERIFY',
  REGISTER = 'REGISTER',
  MAP = 'MAP',
  GOVERNANCE = 'GOVERNANCE'
}

export type DateRange = '7d' | '30d' | '90d';

export interface DashboardMetrics {
  totalPrescriptions: number;
  approvalRate: number;
  counterfeitIncidents: number;
  lowStockItems: number;
  volumeData: { date: string; valid: number; flagged: number }[];
  performanceData: { date: string; ocrAccuracy: number; automationRate: number }[];
  threatOrigins: { origin: string; count: number }[];
}

export enum ThreatLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH'
}

export interface GeoThreat {
  id: string;
  lat: number;
  lng: number;
  locationName: string;
  level: ThreatLevel;
  incidentCount: number;
}

// Governance Types
export enum ProposalType {
  APPROVE_MANUFACTURER = 'APPROVE_MANUFACTURER',
  VERIFY_BATCH = 'VERIFY_BATCH',
  FLAG_SUSPICIOUS_ENTITY = 'FLAG_SUSPICIOUS_ENTITY',
  UPDATE_PROTOCOL = 'UPDATE_PROTOCOL'
}

export enum ProposalStatus {
  ACTIVE = 'ACTIVE',
  PASSED = 'PASSED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED'
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  proposer: string;
  votesFor: number;
  votesAgainst: number;
  deadline: string;
  status: ProposalStatus;
  createdAt: string;
}
