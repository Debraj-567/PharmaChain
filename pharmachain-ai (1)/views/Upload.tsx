import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { analyzePrescriptionImage } from '../services/geminiService';
import { PrescriptionData, AppView } from '../types';

interface UploadProps {
  onAnalysisComplete: (data: PrescriptionData) => void;
  setView: (view: AppView) => void;
}

const Upload: React.FC<UploadProps> = ({ onAnalysisComplete, setView }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG).');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const data = await analyzePrescriptionImage(base64);
        onAnalysisComplete(data);
        setIsProcessing(false);
        setView(AppView.REVIEW);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Prescription</h2>
      <p className="text-gray-500 mb-8">AI will analyze the handwritten text and verify drug authenticity via Blockchain.</p>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all
            ${isDragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="w-16 h-16 text-teal-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Analyzing Prescription...</h3>
              <p className="text-sm text-gray-500 mt-2">Running OCR & Entity Extraction (Gemini 2.5)</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Drag & Drop your file here
              </h3>
              <p className="text-gray-500 mb-6">or click to browse (JPG, PNG)</p>
              
              <input 
                type="file" 
                id="fileInput" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileInput}
              />
              <label 
                htmlFor="fileInput"
                className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 cursor-pointer transition-colors shadow-lg shadow-slate-200"
              >
                Select File
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
             <span className="font-bold">Error:</span> {error}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="p-2 bg-blue-50 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h4 className="font-semibold text-gray-800">OCR Extraction</h4>
            <p className="text-xs text-gray-500 mt-1">Converts handwriting to digital text with high accuracy.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
           <div className="p-2 bg-purple-50 rounded-lg"><FileText className="w-5 h-5 text-purple-600" /></div>
          <div>
            <h4 className="font-semibold text-gray-800">Smart Normalization</h4>
            <p className="text-xs text-gray-500 mt-1">Maps brand names to generic equivalents.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
           <div className="p-2 bg-green-50 rounded-lg"><FileText className="w-5 h-5 text-green-600" /></div>
          <div>
            <h4 className="font-semibold text-gray-800">Blockchain Verify</h4>
            <p className="text-xs text-gray-500 mt-1">Checks supply chain ledger for counterfeit batches.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
