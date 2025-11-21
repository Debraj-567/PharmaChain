
import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldCheck, AlertTriangle, Check, ShieldAlert, Package, Loader2, QrCode, X, Database, FileText, Server } from 'lucide-react';
import { verifyBatchOnChain, fetchFromIPFS } from '../services/blockchainService';
import { BatchInfo, BatchStatus, IPFSMetadata } from '../types';
import Timeline from '../components/Timeline';
import AlertBanner from '../components/AlertBanner';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BatchVerify: React.FC = () => {
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  // IPFS State
  const [ipfsData, setIpfsData] = useState<IPFSMetadata | null>(null);
  const [loadingIpfs, setLoadingIpfs] = useState(false);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  // Trigger verification logic
  const triggerVerification = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setResult(null);
    setIpfsData(null); // Reset previous IPFS data

    try {
      const data = await verifyBatchOnChain(id);
      setResult(data);
      
      // If we have an IPFS hash, automatically fetch the decentralized metadata
      if (data.ipfs_hash) {
        setLoadingIpfs(true);
        fetchFromIPFS(data.ipfs_hash)
          .then(meta => setIpfsData(meta))
          .catch(err => console.error("IPFS Fetch failed", err))
          .finally(() => setLoadingIpfs(false));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerification(batchId);
  };

  // Parse GS1 or raw QR data
  const parseScannedData = (decodedText: string): string => {
    // 1. Check for GS1 Application Identifier (10) which denotes Batch/Lot
    const gs1BatchRegex = /\(10\)([A-Za-z0-9]+)/;
    const gs1Match = decodedText.match(gs1BatchRegex);
    
    if (gs1Match && gs1Match[1]) {
      return gs1Match[1];
    }

    // 2. Check if it's a URL with a batchId query param
    try {
      const url = new URL(decodedText);
      const paramId = url.searchParams.get('batchId');
      if (paramId) return paramId;
    } catch (e) {
      // Not a URL, ignore
    }

    // 3. Fallback: Return raw text (trimmed)
    return decodedText.trim();
  };

  const startScanner = () => {
    setIsScanning(true);
    setResult(null);
    setIpfsData(null);
    
    setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        scanner.render((decodedText) => {
            const parsedId = parseScannedData(decodedText);
            setBatchId(parsedId);
            scanner.clear().then(() => {
                setIsScanning(false);
                triggerVerification(parsedId);
            }).catch(console.error);

        }, (errorMessage) => {
            // ignore
        });

        scannerRef.current = scanner;
    }, 100);
  };

  const stopScanner = () => {
      if (scannerRef.current) {
          scannerRef.current.clear().then(() => {
              setIsScanning(false);
          }).catch(console.error);
      } else {
          setIsScanning(false);
      }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Blockchain Batch Verification</h2>
        <p className="text-gray-500">Scan medicine packaging or manually enter Batch ID to verify authenticity.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {/* Tabs / Mode Switch */}
        <div className="flex justify-center mb-6">
             {!isScanning ? (
                 <button 
                    onClick={startScanner}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                 >
                    <QrCode className="w-5 h-5" />
                    Scan QR / Barcode
                 </button>
             ) : (
                 <div className="w-full max-w-md">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-700">Scanning Camera</h3>
                        <button onClick={stopScanner} className="text-gray-500 hover:text-red-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div id="reader" className="overflow-hidden rounded-lg border-2 border-teal-500"></div>
                    <p className="text-xs text-center text-gray-400 mt-2">Point camera at the data matrix or QR code on the packaging</p>
                 </div>
             )}
        </div>

        {/* Manual Entry Fallback */}
        {!isScanning && (
            <>
                <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or enter manually</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <form onSubmit={handleManualVerify} className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            placeholder="Enter Batch ID (e.g., BATCH_9283)"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !batchId.trim()}
                        className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-70 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Verify
                    </button>
                </form>
            </>
        )}
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Verification Result</h3>
                        <p className="text-sm text-gray-500">Batch ID: {result.batch_id}</p>
                    </div>
                    <div>
                        {result.status === BatchStatus.VERIFIED && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold border border-green-200">
                                <Check className="w-5 h-5" /> AUTHENTIC
                            </div>
                        )}
                        {result.status === BatchStatus.FLAGGED && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold border border-red-200">
                                <ShieldAlert className="w-5 h-5" /> COUNTERFEIT
                            </div>
                        )}
                         {result.status === BatchStatus.EXPIRED && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-bold border border-yellow-200">
                                <AlertTriangle className="w-5 h-5" /> EXPIRED
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Metadata Grid */}
                <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Manufacturer Origin</label>
                        <p className="font-medium text-gray-800 mt-1">{result.origin}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Expiration Date</label>
                        <p className={`font-medium mt-1 ${result.status === BatchStatus.EXPIRED ? 'text-red-600' : 'text-gray-800'}`}>
                            {result.expiryDate}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Transaction Hash</label>
                        <p className="font-mono text-xs text-gray-500 mt-2 break-all bg-white p-2 rounded border border-gray-200">
                            {result.tx_hash}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Decentralized Metadata (IPFS) Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-blue-900">Decentralized Batch Metadata (IPFS)</h3>
                    <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-mono">
                        Protocol: IPFS
                    </span>
                </div>
                
                <div className="p-6">
                    {loadingIpfs ? (
                        <div className="flex items-center gap-3 text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Fetching metadata from decentralized storage...
                        </div>
                    ) : ipfsData ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-xs text-gray-600 break-all">
                                <Server className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">IPFS CID (Hash)</span>
                                    {result.ipfs_hash}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Manufacturing Details
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                                            <span className="text-gray-500">Product</span>
                                            <span className="font-medium">{ipfsData.productName}</span>
                                        </li>
                                        <li className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                                            <span className="text-gray-500">Facility ID</span>
                                            <span className="font-medium">{ipfsData.facilityId}</span>
                                        </li>
                                        <li className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                                            <span className="text-gray-500">Mfg Date</span>
                                            <span className="font-medium">{ipfsData.manufactureDate}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Quality Assurance
                                    </h4>
                                    <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-green-700 uppercase">Certificate of Analysis</span>
                                            <span className="bg-green-200 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded">PASS</span>
                                        </div>
                                        <div className="text-xs text-green-800 mb-2 truncate">
                                            Signed by: {ipfsData.inspectorSignature}
                                        </div>
                                        <a href="#" className="text-xs text-blue-600 underline hover:text-blue-800 block">
                                            View Original Document (IPFS)
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 italic text-sm">
                            No decentralized metadata found for this batch.
                        </div>
                    )}
                </div>
            </div>

            {/* Alerts if any */}
            {result.status !== BatchStatus.VERIFIED && (
                 <AlertBanner 
                    type="error" 
                    title="Safety Warning" 
                    message={result.status === BatchStatus.FLAGGED 
                        ? "This batch has been flagged as counterfeit by the manufacturer. Do not dispense." 
                        : "This batch is past its expiry date. Dispose according to regulations."} 
                 />
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    Supply Chain Ledger
                </h3>
                <Timeline events={result.events} />
            </div>
        </div>
      )}
    </div>
  );
};

export default BatchVerify;
