import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  X, 
  ShieldCheck, 
  Download, 
  Scan, 
  CheckCircle2, 
  ExternalLink, 
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { ECIBoothQRData, Voter } from '../types/voting';
import { voterRegistryInstance } from '../services/voterRegistry';

interface ECIBoothQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoterScanned?: (epicNumber: string) => void;
  initialMode?: 'booth' | 'voter';
}

export const ECIBoothQRModal: React.FC<ECIBoothQRModalProps> = ({
  isOpen,
  onClose,
  onVoterScanned,
  initialMode = 'booth',
}) => {
  const [activeTab, setActiveTab] = useState<'booth' | 'scanner' | 'voterSlips'>(initialMode === 'voter' ? 'scanner' : 'booth');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [boothData, setBoothData] = useState<ECIBoothQRData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isScanningSimulation, setIsScanningSimulation] = useState<boolean>(false);
  const [scanSuccessVoter, setScanSuccessVoter] = useState<Voter | null>(null);

  const voters = voterRegistryInstance.getVoters();

  useEffect(() => {
    if (isOpen) {
      const data = voterRegistryInstance.getBoothQRData();
      setBoothData(data);
      QRCode.toDataURL(data.qrPayloadUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (epic: string) => {
    setIsScanningSimulation(true);
    const voter = voterRegistryInstance.findVoterByEpic(epic);
    setScanSuccessVoter(voter || null);

    setTimeout(() => {
      setIsScanningSimulation(false);
      if (onVoterScanned) {
        onVoterScanned(epic);
      }
      onClose();
    }, 700);
  };

  const handleCopyPayload = () => {
    if (boothData) {
      navigator.clipboard.writeText(boothData.qrPayloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-slate-900 to-emerald-700 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close QR Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl shadow-inner">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-orange-200 font-mono">
                  ECI Official Polling Portal
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 font-semibold border border-emerald-400/30">
                  LIVE
                </span>
              </div>
              <h2 id="qr-modal-title" className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Election Commission Polling QR
              </h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 border-t border-white/10 pt-3">
            <button
              onClick={() => setActiveTab('booth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'booth'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Official Booth QR
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Scan & Fetch Voter ID
            </button>
            <button
              onClick={() => setActiveTab('voterSlips')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'voterSlips'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              e-EPIC Slip QRs
            </button>
          </div>
        </div>

        {/* Tab 1: Official Booth QR */}
        {activeTab === 'booth' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-slate-900 block">
                Official Polling Station Digital Signboard QR
              </span>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Electors scan this QR at Polling Station #42 to connect their smartphone directly to the BharatChain EVM session.
              </p>
            </div>

            {/* Rendered QR Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center max-w-xs mx-auto">
              <div className="relative p-2 bg-white rounded-xl border border-slate-100 shadow-inner">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="ECI Official Booth QR" 
                    className="w-48 h-48 rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                {/* Ashoka Chakra / ECI Emblem Centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center text-xs shadow-md">
                    🇮🇳
                  </div>
                </div>
              </div>

              {/* Station Details */}
              <div className="mt-4 text-center space-y-0.5 w-full pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900">
                  {boothData?.boothName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  ID: {boothData?.boothId} · Constituency: {boothData?.constituency}
                </div>
                <div className="text-[10px] text-emerald-700 font-mono mt-1 font-semibold">
                  Officer Auth: {boothData?.officerId}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleSimulateScan('DEL8849201')}
                className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-2"
              >
                <Scan className="w-4 h-4" />
                <span>Simulate Voter Scanning this Booth QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Camera / Scan Simulator */}
        {activeTab === 'scanner' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-slate-900 block">
                Voter QR Code Scanner Terminal
              </span>
              <p className="text-[11px] text-slate-500">
                Scan your official ECI e-EPIC card or booth QR to instantly auto-fetch your details.
              </p>
            </div>

            {/* Simulated Camera Viewfinder */}
            <div className="relative max-w-xs mx-auto aspect-square bg-slate-950 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-xl flex flex-col items-center justify-center p-4">
              {/* Scanning Reticle Overlay */}
              <div className="absolute inset-8 border-2 border-orange-500/80 rounded-2xl pointer-events-none">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-orange-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-orange-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-orange-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-orange-400" />

                {/* Animated Laser Scan Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse shadow-[0_0_8px_#ea580c]" />
              </div>

              {isScanningSimulation ? (
                <div className="text-center space-y-2 z-10 animate-in fade-in">
                  <div className="w-10 h-10 border-3 border-orange-500 border-t-white rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono text-emerald-400 font-bold">
                    EPIC QR Detected! Decoding...
                  </p>
                </div>
              ) : scanSuccessVoter ? (
                <div className="text-center space-y-1.5 z-10 animate-in zoom-in-95 text-white">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">
                    {scanSuccessVoter.fullName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-300">
                    {scanSuccessVoter.epicNumber}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2 z-10 text-slate-400">
                  <Smartphone className="w-8 h-8 mx-auto text-slate-500" />
                  <p className="text-[11px] font-mono text-slate-300">
                    Position ECI QR within the frame
                  </p>
                </div>
              )}
            </div>

            {/* Quick 1-Click Scan Profiles */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-700 block text-center">
                Select an Official Registered Voter Card to Scan:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {voters.slice(0, 4).map((v) => (
                  <button
                    key={v.epicNumber}
                    type="button"
                    onClick={() => handleSimulateScan(v.epicNumber)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-500 hover:bg-orange-50/40 text-left transition-all shadow-2xs group"
                  >
                    <div className="text-xs font-bold text-slate-900 group-hover:text-orange-950 truncate">
                      {v.fullName}
                    </div>
                    <div className="flex items-center justify-between mt-0.5 text-[10px] font-mono text-slate-500">
                      <span>{v.epicNumber}</span>
                      <span className="text-emerald-700 font-bold">Scan &rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: e-EPIC Voter Slips */}
        {activeTab === 'voterSlips' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-slate-900 block">
                Official ECI Voter Information Slips (VIS)
              </span>
              <p className="text-[11px] text-slate-500">
                Each registered citizen receives a unique QR slip with their assigned 6-digit Security PIN.
              </p>
            </div>

            <div className="space-y-3">
              {voters.map((v) => (
                <div 
                  key={v.epicNumber}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{v.fullName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {v.epicNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      DOB: {v.dob} · {v.constituency}
                    </p>
                    <div className="text-[11px] text-amber-900 font-medium">
                      Assigned Secret PIN: <strong className="font-mono text-slate-900">{v.voterPin}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateScan(v.epicNumber)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 shrink-0 transition-colors flex items-center gap-1.5"
                  >
                    <Scan className="w-3.5 h-3.5 text-orange-600" />
                    <span>Scan Slip</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ECI Cryptographic Polling Station Protocol</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
