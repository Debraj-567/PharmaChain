
import { BatchInfo, BatchStatus, NFTStatus, IPFSMetadata } from "../types";

// In-memory store to persist redeemed state during the session
const REDEEMED_TOKENS = new Set<string>();

// In-memory store to simulate the Blockchain Ledger and IPFS Network for the session
// This allows the "Register Batch" flow to actually work and show up in "Verify"
const CHAIN_STATE = new Map<string, BatchInfo>();
const IPFS_STORAGE = new Map<string, IPFSMetadata>();

export const uploadToIPFS = async (file: File, metadata: Partial<IPFSMetadata>): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Store in our mock IPFS network
      IPFS_STORAGE.set(mockCid, {
        productName: metadata.productName || "Unknown Product",
        batchId: metadata.batchId || "UNKNOWN",
        manufactureDate: metadata.manufactureDate || new Date().toISOString().split('T')[0],
        facilityId: metadata.facilityId || "FAC-GEN-01",
        inspectorSignature: "0xSignedByPinataService",
        coaUrl: `ipfs://${mockCid}/${file.name}`,
        ingredients: metadata.ingredients || ["Active Ingredient A", "Excipient B"]
      });

      console.log(`[IPFS] File ${file.name} uploaded with CID: ${mockCid}`);
      resolve(mockCid);
    }, 1500); // Upload latency
  });
};

export const registerBatchOnChain = async (batchId: string, ipfsHash: string, expiryDate: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const txHash = `0x${Math.random().toString(16).substring(2, 40)}`;
      
      // Create the on-chain record
      const newBatchRecord: BatchInfo = {
        batch_id: batchId,
        status: BatchStatus.VERIFIED,
        origin: "Registered via PharmaChain UI",
        expiryDate: expiryDate,
        tx_hash: txHash,
        ipfs_hash: ipfsHash,
        events: [
          {
            timestamp: new Date().toISOString(),
            actor: "Manufacturer",
            action: "BatchRegistered",
            location: "Online Dashboard",
            txHash: txHash
          }
        ]
      };

      CHAIN_STATE.set(batchId, newBatchRecord);
      console.log(`[Blockchain] Batch ${batchId} registered at ${txHash}`);
      resolve(txHash);
    }, 2000); // Transaction mining time
  });
};

// Simulates a smart contract call
export const verifyBatchOnChain = async (query: string): Promise<BatchInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Check our session-based ledger first (Dynamic Data)
      if (CHAIN_STATE.has(query)) {
        resolve(CHAIN_STATE.get(query)!);
        return;
      }

      // 2. Fallback to Deterministic/Random status for testing specific IDs (Static Data)
      let isCounterfeit = false;
      let isExpired = false;
      
      if (query.toUpperCase().includes('FAKE') || query.toUpperCase().includes('BAD')) isCounterfeit = true;
      else if (query.toUpperCase().includes('EXP')) isExpired = true;
      else {
         if (!query.toUpperCase().startsWith('BATCH') && !query.toUpperCase().startsWith('0X')) {
             isCounterfeit = Math.random() > 0.9;
             isExpired = Math.random() > 0.95;
         }
      }

      let status = BatchStatus.VERIFIED;
      if (isCounterfeit) status = BatchStatus.FLAGGED;
      if (isExpired) status = BatchStatus.EXPIRED;

      const finalBatchId = query.toUpperCase().startsWith('BATCH') || query.toUpperCase().startsWith('0X')
        ? query 
        : `BATCH_${Math.floor(Math.random() * 100000)}`;

      const mockIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}XyZ${Math.random().toString(36).substring(2, 15)}`;

      resolve({
        batch_id: finalBatchId,
        status: status,
        origin: "PharmaCorp Global Manufacturing",
        expiryDate: isExpired ? "2023-01-01" : "2026-12-31",
        tx_hash: "0x71c469e192d021d5d6e7f46725420c6093469507",
        ipfs_hash: mockIpfsHash,
        events: [
          {
            timestamp: "2024-01-10T10:00:00Z",
            actor: "Manufacturer",
            action: "BatchRegistered",
            location: "Bern, Switzerland",
            txHash: "0xabc...123"
          },
          {
            timestamp: "2024-01-15T14:30:00Z",
            actor: "LogisticsProvider",
            action: "ShipmentReceived",
            location: "Frankfurt, Germany",
            txHash: "0xdef...456"
          },
          {
            timestamp: "2024-01-20T09:15:00Z",
            actor: "Distributor",
            action: "QualityCheckPassed",
            location: "London, UK",
            txHash: "0xghi...789"
          },
          {
            timestamp: "2024-01-22T16:45:00Z",
            actor: "Pharmacy",
            action: "StockIn",
            location: "New York, USA",
            txHash: "0xjkl...012"
          }
        ]
      });
    }, 800);
  });
};

// Simulate fetching JSON metadata from IPFS Gateway
export const fetchFromIPFS = async (cid: string): Promise<IPFSMetadata> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Check in-memory storage
      if (IPFS_STORAGE.has(cid)) {
        resolve(IPFS_STORAGE.get(cid)!);
        return;
      }

      // 2. Fallback mock data
      resolve({
        productName: "Amoxicillin 500mg Capsules",
        batchId: `BATCH-${cid.substring(2, 8)}`,
        manufactureDate: "2024-01-01",
        facilityId: "FAC-BERN-04",
        inspectorSignature: "0xSignedByDrHoffman...Verification",
        coaUrl: `ipfs://${cid}/coa.pdf`,
        ingredients: ["Amoxicillin Trihydrate", "Magnesium Stearate", "Titanium Dioxide"]
      });
    }, 1200);
  });
};

export const checkNFTStatus = async (tokenId: string): Promise<NFTStatus> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (REDEEMED_TOKENS.has(tokenId)) {
        resolve(NFTStatus.REDEEMED);
        return;
      }
      if (tokenId.endsWith('99')) {
        resolve(NFTStatus.REDEEMED);
      } else {
        resolve(NFTStatus.ACTIVE);
      }
    }, 1200);
  });
};

export const redeemPrescriptionNFT = async (tokenId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[Blockchain] NFT ${tokenId} burned/marked redeemed.`);
      REDEEMED_TOKENS.add(tokenId);
      resolve(true);
    }, 2000);
  });
};
