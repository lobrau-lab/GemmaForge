import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface HfTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  isAlreadyVerified: boolean;
}

export const HfTokenModal: React.FC<HfTokenModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  isAlreadyVerified,
}) => {
  const [token, setToken] = useState<string>(isAlreadyVerified ? 'hf_GemmaVerifiedClusterToken_••••••••' : '');
  const [licenseAgreed, setLicenseAgreed] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<boolean>(isAlreadyVerified);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(true);
    onVerified();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Hugging Face Gated Access & License Token</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleVerify} className="p-5 space-y-4">
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Google Gemma models are distributed under the Gemma Open Model License Agreement.
            To download checkpoints into your GPU cluster cache, provide a Hugging Face User Access Token
            with read permissions.
          </p>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Hugging Face Token (hf_...):</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">
              Gated Repository Verification Status:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>google/gemma-2-2b</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>google/gemma-2-9b</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>google/gemma-2-27b</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>google/gemma-3-suite</span>
              </span>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer text-slate-300 text-[11px]">
            <input
              type="checkbox"
              checked={licenseAgreed}
              onChange={(e) => setLicenseAgreed(e.target.checked)}
              className="mt-0.5 accent-amber-500 rounded"
            />
            <span>
              I accept the Google Gemma Terms of Use and confirm cluster storage isolation complies with data policies.
            </span>
          </label>

          {successMsg ? (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Token and Gated License credentials verified successfully!</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!licenseAgreed}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold hover:from-amber-400 hover:to-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Token & Cache Access</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
