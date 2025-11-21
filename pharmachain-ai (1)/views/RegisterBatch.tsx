
import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Loader2, CheckCircle, Factory, Hash, Calendar, ShieldCheck, X, Image as ImageIcon } from 'lucide-react';
import { uploadToIPFS, registerBatchOnChain } from '../services/blockchainService';
import AlertBanner from '../components/AlertBanner';

const RegisterBatch: React.FC = () => {
  const [formData, setFormData] = useState({
    productName: '',
    batchId: '',
    expiryDate: '',
    facilityId: 'FAC-US-NY-01'
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING_IPFS' | 'REGISTERING_CHAIN' | 'SUCCESS'>('IDLE');
  const [result, setResult] = useState<{ txHash: string; ipfsHash: string } | null>(null);

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview if it's an image
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.batchId || !formData.productName) return;

    try {
      // Step 1: IPFS Upload
      setStatus('UPLOADING_IPFS');
      const ipfsHash = await uploadToIPFS(file, {
        productName: formData.productName,
        batchId: formData.batchId,
        manufactureDate: new Date().toISOString().split('T')[0],
        facilityId: formData.facilityId,
        ingredients: ["Active Principle A", "Stabilizer B"]
      });

      // Step 2: Blockchain Transaction
      setStatus('REGISTERING_CHAIN');
      const txHash = await registerBatchOnChain(formData.batchId, ipfsHash, formData.expiryDate);

      setResult({ txHash, ipfsHash });
      setStatus('SUCCESS');
    } catch (error) {
      console.error("Registration failed", error);
      setStatus('IDLE');
      alert("Failed to register batch. See console.");
    }
  };

  if (status === 'SUCCESS' && result) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-green-100 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Registered Successfully!</h2>
        <p className="text-gray-500 mb-8">
          The batch metadata has been pinned to IPFS and the hash is immutable on the Ethereum blockchain.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 text-left space-y-4 mb-8">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Batch ID</label>
            <p className="font-mono font-bold text-gray-800">{formData.batchId}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">IPFS Content Hash (CID)</label>
            <p className="font-mono text-xs text-blue-600 break-all">{result.ipfsHash}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Ethereum Transaction Hash</label>
            <p className="font-mono text-xs text-gray-500 break-all">{result.txHash}</p>
          </div>
        </div>

        <button 
          onClick={() => { setStatus('IDLE'); setResult(null); setFormData(prev => ({...prev, batchId: ''})); setFile(null); setPreviewUrl(null); }}
          className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          Register Another Batch
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Factory className="w-6 h-6 text-teal-600" />
          Register New Batch
        </h2>
        <p className="text-gray-500 mt-1">Upload Quality Assurance documents to IPFS and record batch provenance on-chain.</p>
      </div>

      <form onSubmit={handleRegister} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 space-y-6">
          
          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                type="text" 
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleInputChange}
                  placeholder="e.g. BATCH_2024_001"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                  required 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                  type="date" 
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  required 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Facility</label>
              <input 
                type="text" 
                name="facilityId"
                value={formData.facilityId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50"
                readOnly
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Certificate of Analysis (CoA)</label>
            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors relative ${file ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}>
              
              {file ? (
                <div className="flex flex-col items-center z-10">
                  {previewUrl ? (
                    <div className="relative mb-4 group">
                         <img src={previewUrl} alt="Preview" className="h-32 w-auto object-contain rounded-lg shadow-sm border border-gray-200 bg-white" />
                    </div>
                  ) : (
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-gray-200">
                         <FileText className="w-8 h-8 text-teal-600" />
                     </div>
                  )}
                  
                  <p className="font-bold text-teal-900">{file.name}</p>
                  <p className="text-xs text-teal-600 mt-1 mb-4">{(file.size / 1024).toFixed(1)} KB • Ready to Pin</p>
                  
                  <button 
                    type="button" 
                    onClick={handleRemoveFile} 
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-full hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                  >
                    <X className="w-3 h-3" /> Remove File
                  </button>
                </div>
              ) : (
                <>
                   <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                   <p className="text-gray-600">Drag & Drop or <span className="text-teal-600 font-medium">Browse</span></p>
                   <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG supported</p>
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
                </>
              )}
            </div>
          </div>

          {/* Submit Area */}
          <div className="border-t border-gray-100 pt-6 flex items-center justify-end gap-4">
            {status !== 'IDLE' && (
              <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                {status === 'UPLOADING_IPFS' ? 'Pinning to IPFS...' : 'Confirming on Blockchain...'}
              </div>
            )}
            <button 
              type="submit" 
              disabled={status !== 'IDLE' || !file}
              className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Register Batch
            </button>
          </div>

        </div>
      </form>

      <div className="mt-6">
        <AlertBanner 
          type="info" 
          title="Decentralized Storage Info" 
          message="Files are uploaded to IPFS via Pinata simulation. The Content ID (CID) is stored permanently on the Ethereum ledger, ensuring the document cannot be altered without changing the hash." 
        />
      </div>
    </div>
  );
};

export default RegisterBatch;
