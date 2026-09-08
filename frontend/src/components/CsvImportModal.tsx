import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { playerService } from '../services/api';
import { ImportResult } from '../types';
import { useAuction } from '../context/AuctionContext';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useAuction();
  const [file, setFile] = useState<File | null>(null);
  const [wipeExisting, setWipeExisting] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await playerService.importCsv(file, undefined, wipeExisting);
      setResult(res);
      showToast(res.message, 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to import CSV';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Roll Number,Name,Year,Player Style\n" +
      "21MECH101,Hardik Pandya,4th Year,ALL_ROUNDER\n" +
      "22CSE045,Rishabh Pant,3rd Year,WICKET_KEEPER\n" +
      "23ECE019,Kuldeep Yadav,2nd Year,BOWLER\n" +
      "22IT078,Axar Patel,3rd Year,ALL_ROUNDER\n" +
      "21CIVIL034,Mohammed Siraj,4th Year,BOWLER\n" +
      "23CSE099,Shubman Gill,2nd Year,BATSMAN\n" +
      "21ECE014,Sanju Samson,4th Year,WICKET_KEEPER\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "google_form_players_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Upload className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-white">IMPORT GOOGLE FORM PLAYERS</h3>
            <p className="text-xs text-slate-400">Upload entire tournament spreadsheet at once</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">Required 4 Google Form Fields:</span>
            <button
              onClick={downloadSampleCsv}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Sample Template
            </button>
          </div>
          <div className="bg-slate-900/90 px-3 py-2 rounded-xl font-mono text-[11px] text-amber-300/90 border border-slate-800">
            Roll Number, Name, Year, Player Style
          </div>
          
          {/* Rules highlight */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>⚡ Base Price Rules:</span>
              <span className="text-amber-400 font-bold">2nd Year: ₹15 | 3rd Year: ₹20 | 4th Year: ₹20</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>🚫 1st Year:</span>
              <span className="text-rose-400 font-semibold">Excluded (Automatically skipped)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>🎲 Auto-Interleaved:</span>
              <span className="text-emerald-400 font-semibold">2nd → 3rd → 4th year alternation</span>
            </div>
          </div>
        </div>

        {/* Wipe Existing Option */}
        <div className="mb-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
          <input
            type="checkbox"
            id="wipeExistingCheck"
            checked={wipeExisting}
            onChange={(e) => setWipeExisting(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="wipeExistingCheck" className="text-xs text-slate-300 cursor-pointer select-none">
            <strong className="text-amber-400 block">Wipe old test data & start fresh tournament</strong>
            <span className="text-[11px] text-slate-500">Clears old test players, resets all team purses to 1000 pts, and sets Round 1.</span>
          </label>
        </div>

        {/* Upload Drop Area */}
        <div className="mb-5">
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl cursor-pointer bg-slate-950/60 transition-colors">
            <div className="flex flex-col items-center justify-center pt-4 pb-5">
              <FileText className="w-7 h-7 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 font-medium">
                {file ? file.name : <span className="text-amber-400 font-semibold">Click to select CSV file</span>}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">UTF-8 .csv export from Google Forms / Sheets</p>
            </div>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Result summary card */}
        {result && (
          <div className="mb-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              {result.message}
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="bg-slate-900 p-2 rounded-xl">
                <div className="text-[10px] text-slate-500">Total</div>
                <div className="font-bold text-sm text-white">{result.total}</div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
                <div className="text-[10px] text-emerald-400">Imported</div>
                <div className="font-bold text-sm text-emerald-300">{result.imported}</div>
              </div>
              <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl">
                <div className="text-[10px] text-amber-400">Duplicates</div>
                <div className="font-bold text-sm text-amber-300">{result.duplicates}</div>
              </div>
              <div className="bg-rose-950/40 border border-rose-500/30 p-2 rounded-xl">
                <div className="text-[10px] text-rose-400">Invalid</div>
                <div className="font-bold text-sm text-rose-300">{result.invalid}</div>
              </div>
            </div>

            {result.duplicateRollNumbers.length > 0 && (
              <div className="text-[11px] text-amber-400/80 pt-1">
                Duplicates skipped: {result.duplicateRollNumbers.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-glow-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? 'Processing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
