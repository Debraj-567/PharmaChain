
import React, { useState, useEffect } from 'react';
import { PrescriptionData, Medication, BatchStatus, AlternativeMedicine, DrugInteraction, InteractionSeverity, NFTStatus } from '../types';
import { AlertTriangle, Check, Edit2, Search, ShieldCheck, ShieldAlert, X, ExternalLink, Sparkles, Pill, Activity, Printer, Download, FileText, Lock, UserCheck, Loader2, Link as LinkIcon, Database } from 'lucide-react';
import { verifyBatchOnChain, redeemPrescriptionNFT, checkNFTStatus } from '../services/blockchainService';
import { getAlternatives } from '../services/inventoryService';
import { checkDrugInteractions } from '../services/clinicalService';
import { triggerPrint, downloadJSON, downloadCSV, generatePrescriptionCSV } from '../services/exportService';
import AlertBanner from '../components/AlertBanner';
import Timeline from '../components/Timeline';

interface ReviewProps {
  data: PrescriptionData;
}

const Review: React.FC<ReviewProps> = ({ data }) => {
  const [prescription, setPrescription] = useState<PrescriptionData>(data);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  
  // Clinical Checks
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);

  // NFT State
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isVerifyingNFT, setIsVerifyingNFT] = useState(false);
  const [nftStatus, setNftStatus] = useState<NFTStatus>(data.nft?.status || NFTStatus.INVALID);

  // Alternatives State
  const [loadingAltsId, setLoadingAltsId] = useState<string | null>(null);
  const [viewingAltsId, setViewingAltsId] = useState<string | null>(null);
  const [alternativesCache, setAlternativesCache] = useState<Record<string, AlternativeMedicine[]>>({});

  const [selectedBatchForTimeline, setSelectedBatchForTimeline] = useState<string | null>(null);

  // Verify NFT Status on Load (Live Chain Check)
  useEffect(() => {
    const verifyNFT = async () => {
        if (prescription.nft) {
            setIsVerifyingNFT(true);
            try {
                const status = await checkNFTStatus(prescription.nft.tokenId);
                setNftStatus(status);
                setPrescription(prev => ({
                    ...prev,
                    nft: prev.nft ? { ...prev.nft, status: status } : undefined
                }));
            } catch (err) {
                console.error("Failed to verify NFT on-chain", err);
            } finally {
                setIsVerifyingNFT(false);
            }
        }
    };
    verifyNFT();
  }, []);

  // Run interaction checks whenever medications change
  useEffect(() => {
    const runClinicalChecks = async () => {
        if (prescription.medications.length > 0) {
            setIsCheckingInteractions(true);
            try {
                const results = await checkDrugInteractions(prescription.medications);
                setInteractions(results);
            } catch (err) {
                console.error("Clinical check failed", err);
            } finally {
                setIsCheckingInteractions(false);
            }
        }
    };
    runClinicalChecks();
  }, [prescription.medications]);

  const handleVerify = async (medId: string, medName: string) => {
    setVerifyingId(medId);
    try {
      const batchInfo = await verifyBatchOnChain(medName);
      setPrescription(prev => ({
        ...prev,
        medications: prev.medications.map(m => 
          m.id === medId ? { ...m, blockchain_check: batchInfo } : m
        )
      }));
    } catch (error) {
      console.error("Verification failed", error);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleGetAlternatives = async (medId: string, medName: string) => {
    if (alternativesCache[medId]) {
        setViewingAltsId(viewingAltsId === medId ? null : medId);
        return;
    }

    setLoadingAltsId(medId);
    try {
        const alts = await getAlternatives(medName);
        setAlternativesCache(prev => ({ ...prev, [medId]: alts }));
        setViewingAltsId(medId);
    } catch (err) {
        console.error("Failed to fetch alternatives", err);
    } finally {
        setLoadingAltsId(null);
    }
  };

  const saveEdits = (medId: string, newName: string, newStrength: string, newFreq: string, newDuration: string) => {
      setPrescription(prev => ({
          ...prev,
          medications: prev.medications.map(m => 
              m.id === medId ? { 
                  ...m, 
                  name_normalized: newName,
                  strength: newStrength,
                  frequency: newFreq,
                  duration: newDuration
              } : m
          )
      }));
      setEditingId(null);
  };

  const handleDispense = async () => {
      if (!prescription.nft) return;
      setIsRedeeming(true);
      try {
          const success = await redeemPrescriptionNFT(prescription.nft.tokenId);
          if (success) {
              setNftStatus(NFTStatus.REDEEMED);
              setPrescription(prev => ({
                  ...prev,
                  nft: prev.nft ? { ...prev.nft, status: NFTStatus.REDEEMED } : undefined
              }));
          }
      } catch (err) {
          console.error("Redemption failed", err);
      } finally {
          setIsRedeeming(false);
      }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.9) return 'text-green-600 bg-green-50';
    if (score > 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleExportJSON = () => {
      downloadJSON(prescription, `prescription_${prescription.id}.json`);
  };

  const handleExportCSV = () => {
      const csv = generatePrescriptionCSV(prescription);
      downloadCSV(csv, `prescription_${prescription.id}.csv`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6 print:h-auto print:block">
      {/* Watermark for Print */}
      <div className="hidden print:flex fixed inset-0 items-center justify-center pointer-events-none z-50 opacity-10">
         <h1 className="text-6xl font-black text-gray-500 -rotate-45">CONFIDENTIAL - PHARMACHAIN</h1>
      </div>

      {/* Left Panel: Image & NFT */}
      <div className="w-1/3 flex flex-col gap-6 print:w-full print:mb-4">
        {/* Image Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden flex-1 print:border-0 print:shadow-none">
            <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 flex justify-between items-center print:hidden">
            <span>Original Image</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{prescription.id}</span>
            </div>
            <div className="flex-1 bg-gray-900 relative overflow-auto flex items-center justify-center print:bg-white print:h-64">
            {prescription.imageUrl ? (
                <img src={prescription.imageUrl} alt="Prescription" className="max-w-full max-h-full object-contain print:object-contain print:max-h-64" />
            ) : (
                <div className="text-gray-500">No image available</div>
            )}
            </div>
        </div>

        {/* NFT Token Card */}
        {prescription.nft && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 print:hidden relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm z-20">
                    <LinkIcon className="w-3 h-3" /> SOULBOUND (NON-TRANSFERABLE)
                </div>

                {/* Redeemed Stamp Overlay */}
                {nftStatus === NFTStatus.REDEEMED && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none bg-white/50 backdrop-blur-[1px]">
                        <div className="border-4 border-red-600 text-red-600 font-black text-4xl px-6 py-2 rounded-xl opacity-80 rotate-[-15deg] shadow-xl">
                            REDEEMED
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 mb-4 mt-2">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Prescription Token</h3>
                        <p className="text-xs text-gray-500">Authentic Digital Asset</p>
                    </div>
                </div>

                <div className="space-y-3 text-sm mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between py-1 border-b border-gray-200 border-dashed">
                        <span className="text-gray-500 text-xs font-medium uppercase">Token ID</span>
                        <span className="font-mono text-xs text-gray-800">{prescription.nft.tokenId}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200 border-dashed">
                        <span className="text-gray-500 text-xs font-medium uppercase">Owner</span>
                        <span className="font-mono text-xs text-gray-700 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> {prescription.nft.owner}
                        </span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-gray-500 text-xs font-medium uppercase">Minted</span>
                        <span className="text-gray-700 text-xs">{new Date(prescription.nft.mintTimestamp).toLocaleDateString()}</span>
                    </div>
                </div>

                {isVerifyingNFT ? (
                    <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50 flex items-center justify-center gap-2 text-indigo-700 text-sm font-medium animate-pulse">
                         <Loader2 className="w-4 h-4 animate-spin" /> Verifying On-Chain...
                    </div>
                ) : (
                    <div className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm transition-all duration-500 ${
                        nftStatus === NFTStatus.ACTIVE 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        {nftStatus === NFTStatus.ACTIVE ? (
                            <><Check className="w-4 h-4" /> TOKEN VALID - ACTIVE</>
                        ) : (
                            <><X className="w-4 h-4" /> TOKEN REDEEMED - INVALID</>
                        )}
                    </div>
                )}
                
                <div className="mt-3 text-center">
                    <a href="#" className="text-[10px] text-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-1 transition-colors">
                        View on Block Explorer <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                </div>
            </div>
        )}
      </div>

      {/* Right Panel: Data & Verification */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden print:w-full print:border-0 print:shadow-none print:overflow-visible">
        <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Prescription Review</h2>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            Patient: <span className="font-medium text-gray-800">{prescription.patient_name.value}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ml-1 ${getConfidenceColor(prescription.patient_name.confidence)}`}>
                                {Math.round(prescription.patient_name.confidence * 100)}%
                            </span>
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1">
                            Prescriber: <span className="font-medium text-gray-800">{prescription.prescriber.value}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ml-1 ${getConfidenceColor(prescription.prescriber.confidence)}`}>
                                {Math.round(prescription.prescriber.confidence * 100)}%
                            </span>
                        </span>
                    </div>
                </div>
                
                {/* Action Buttons - Hidden on Print */}
                <div className="flex gap-2 print:hidden">
                    <button 
                        onClick={handleExportJSON}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Download JSON"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Download CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={triggerPrint}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Print / Save as PDF"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                    <div className="w-px bg-gray-300 mx-1"></div>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 font-medium">
                        Reject
                    </button>
                    <button 
                        onClick={handleDispense}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 font-medium shadow-sm shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        disabled={interactions.some(i => i.severity === InteractionSeverity.HIGH) || nftStatus === NFTStatus.REDEEMED || isRedeeming || isVerifyingNFT}
                    >
                        {isRedeeming && <Loader2 className="w-4 h-4 animate-spin" />}
                        {nftStatus === NFTStatus.REDEEMED ? 'Already Dispensed' : 'Approve & Dispense'}
                    </button>
                </div>
            </div>

            <div className="space-y-2 mt-4">
                {/* Drug Interactions Warnings */}
                {interactions.length > 0 && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                        {interactions.map((interaction, i) => (
                             <AlertBanner 
                                key={`int-${i}`} 
                                type={interaction.severity === InteractionSeverity.HIGH ? 'error' : 'warning'} 
                                title={`${interaction.severity} SEVERITY INTERACTION: ${interaction.pair.join(' + ')}`} 
                                message={`${interaction.description} ${interaction.recommendation}`} 
                                className="border-l-4"
                             />
                        ))}
                    </div>
                )}

                {/* NFT Warning */}
                {!isVerifyingNFT && nftStatus === NFTStatus.REDEEMED && (
                    <AlertBanner 
                        type="error" 
                        title="Duplicate Dispense Blocked" 
                        message="This prescription NFT has already been redeemed. Do not dispense medication."
                        className="border-l-4"
                    />
                )}

                {/* General OCR Warnings */}
                {prescription.warnings.length > 0 && (
                    <div className="space-y-2">
                        {prescription.warnings.map((w, i) => (
                             <AlertBanner key={i} type="info" title="Review Note" message={w} className="py-2" />
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 print:bg-white print:overflow-visible print:h-auto">
            <div className="space-y-4">
                {prescription.medications.map((med) => (
                    <div key={med.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md print:shadow-none print:border-gray-300 print:break-inside-avoid">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs print:border print:border-gray-200">
                                    Rx
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{med.name_normalized}</h3>
                                    <p className="text-xs text-gray-500 font-mono">Detected: "{med.raw_text}"</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(med.ocr_confidence)} print:border print:border-gray-200`}>
                                    OCR: {Math.round(med.ocr_confidence * 100)}%
                                </div>
                                <button 
                                    onClick={() => setEditingId(editingId === med.id ? null : med.id)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors print:hidden"
                                >
                                    {editingId === med.id ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="p-4 grid grid-cols-12 gap-6">
                            {/* Details Column */}
                            <div className="col-span-7 grid grid-cols-2 gap-4 print:col-span-12">
                                {editingId === med.id ? (
                                    <form 
                                        className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.target as HTMLFormElement;
                                            const data = new FormData(form);
                                            saveEdits(
                                                med.id, 
                                                data.get('name') as string,
                                                data.get('strength') as string,
                                                data.get('frequency') as string,
                                                data.get('duration') as string
                                            );
                                        }}
                                    >
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Medication Name</label>
                                            <input name="name" type="text" defaultValue={med.name_normalized} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Strength</label>
                                            <input name="strength" type="text" defaultValue={med.strength} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Frequency</label>
                                            <input name="frequency" type="text" defaultValue={med.frequency} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Duration</label>
                                            <input name="duration" type="text" defaultValue={med.duration} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                                        </div>
                                        <div className="col-span-2 flex gap-2 mt-2">
                                            <button type="button" onClick={() => setEditingId(null)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">Cancel</button>
                                            <button type="submit" className="flex-1 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700">Save & Re-Check</button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold uppercase">Strength</p>
                                            <p className="font-medium text-gray-800">{med.strength}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold uppercase">Form</p>
                                            <p className="font-medium text-gray-800">{med.form}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold uppercase">Frequency</p>
                                            <p className="font-medium text-gray-800">{med.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold uppercase">Duration</p>
                                            <p className="font-medium text-gray-800">{med.duration}</p>
                                        </div>
                                    </>
                                )}
                                
                                {/* Actions Row - Only show if not editing */}
                                {editingId !== med.id && (
                                    <div className="col-span-2 flex gap-2 mt-2 print:hidden">
                                        {/* Catalog Match (Existing) */}
                                        <div className="flex-1 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Search className="w-3 h-3 text-blue-600" />
                                                <span className="text-xs font-bold text-blue-800">Catalog Match</span>
                                            </div>
                                            <p className="text-sm text-blue-900 font-medium truncate">{med.catalog_matches[0]?.brand}</p>
                                        </div>

                                        {/* Alternatives Trigger (New) */}
                                        <button 
                                            onClick={() => handleGetAlternatives(med.id, med.name_normalized)}
                                            className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                                                viewingAltsId === med.id 
                                                ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                                                : 'bg-purple-50 border-purple-100 text-purple-900 hover:bg-purple-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className={`w-3 h-3 ${viewingAltsId === med.id ? 'text-purple-200' : 'text-purple-600'}`} />
                                                <span className={`text-xs font-bold ${viewingAltsId === med.id ? 'text-purple-100' : 'text-purple-800'}`}>Alternatives</span>
                                            </div>
                                            <p className={`text-xs font-medium ${viewingAltsId === med.id ? 'text-white' : 'text-purple-900'}`}>
                                                {loadingAltsId === med.id ? 'Finding...' : 'Suggest Generics'}
                                            </p>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Blockchain Verification Column */}
                            <div className="col-span-5 border-l border-gray-100 pl-6 print:col-span-12 print:border-l-0 print:pl-0 print:mt-4 print:border-t print:pt-4">
                                {!med.blockchain_check ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center print:block print:text-left">
                                        <ShieldCheck className="w-8 h-8 text-gray-300 mb-2 print:hidden" />
                                        <p className="text-sm text-gray-500 mb-3 print:inline">Authentication Pending </p>
                                        <button 
                                            onClick={() => handleVerify(med.id, med.name_normalized)}
                                            disabled={verifyingId === med.id}
                                            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-70 print:hidden"
                                        >
                                            {verifyingId === med.id ? (
                                                 <span className="animate-pulse">Verifying...</span>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-4 h-4" /> Verify Batch
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-gray-400 uppercase">Status</span>
                                            {med.blockchain_check.status === BatchStatus.VERIFIED && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">
                                                    <Check className="w-3 h-3" /> AUTHENTIC
                                                </span>
                                            )}
                                            {med.blockchain_check.status === BatchStatus.FLAGGED && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">
                                                    <ShieldAlert className="w-3 h-3" /> COUNTERFEIT
                                                </span>
                                            )}
                                             {med.blockchain_check.status === BatchStatus.EXPIRED && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold border border-yellow-200">
                                                    <AlertTriangle className="w-3 h-3" /> EXPIRED
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Batch ID:</span>
                                                <span className="font-mono">{med.blockchain_check.batch_id}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Origin:</span>
                                                <span className="truncate max-w-[120px]" title={med.blockchain_check.origin}>{med.blockchain_check.origin}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Expires:</span>
                                                <span>{med.blockchain_check.expiryDate}</span>
                                            </div>
                                            {med.blockchain_check.ipfs_hash && (
                                                <div className="flex justify-between text-blue-600">
                                                    <span>IPFS:</span>
                                                    <span className="font-mono truncate w-20 flex items-center gap-1">
                                                        <Database className="w-3 h-3" /> 
                                                        {med.blockchain_check.ipfs_hash.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => setSelectedBatchForTimeline(selectedBatchForTimeline === med.id ? null : med.id)}
                                            className="w-full mt-2 py-1.5 text-xs text-teal-600 border border-teal-200 bg-teal-50 rounded hover:bg-teal-100 flex items-center justify-center gap-1 print:hidden"
                                        >
                                           {selectedBatchForTimeline === med.id ? 'Hide Chain' : 'View Supply Chain'} <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                         {/* Alternatives Panel - Hidden on Print */}
                         {viewingAltsId === med.id && alternativesCache[med.id] && (
                            <div className="border-t border-purple-100 bg-purple-50/50 p-4 print:hidden">
                                <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" /> 
                                    Suggested Alternatives for {med.name_normalized}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {alternativesCache[med.id].map((alt) => (
                                        <div key={alt.medicine_id} className="bg-white rounded-lg border border-purple-100 shadow-sm p-3 relative overflow-hidden group hover:border-purple-300 transition-all">
                                            {alt.same_api && (
                                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                                    SAME API
                                                </div>
                                            )}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="p-1.5 bg-purple-50 rounded-md text-purple-600">
                                                    <Pill className="w-4 h-4" />
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded-full ${alt.in_stock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                    {alt.in_stock ? 'In Stock' : 'Out of Stock'}
                                                </div>
                                            </div>
                                            <h5 className="font-bold text-gray-800 text-sm">{alt.brand}</h5>
                                            <p className="text-xs text-gray-500 mb-2">{alt.generic_name}</p>
                                            
                                            <div className="flex items-end justify-between mt-2">
                                                <div>
                                                    <span className="text-lg font-bold text-gray-900">${alt.estimated_price}</span>
                                                    <span className="text-xs text-gray-500 ml-1">{alt.currency}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Equivalence</div>
                                                    <div className="text-xs font-bold text-purple-700">{(alt.equivalence_score * 100).toFixed(0)}% Match</div>
                                                </div>
                                            </div>
                                            <button className="w-full mt-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-200">
                                                Select Alternative
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}

                         {/* Timeline Expand */}
                         {selectedBatchForTimeline === med.id && med.blockchain_check && (
                            <div className="border-t border-gray-200 bg-slate-50 p-4 print:bg-white print:border-t-0">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 ml-4">Supply Chain History (Immutable Ledger)</h4>
                                <Timeline events={med.blockchain_check.events} />
                            </div>
                         )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
