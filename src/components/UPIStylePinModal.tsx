import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  X, 
  Delete, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { Candidate, Voter } from '../types/voting';
import { voterRegistryInstance } from '../services/voterRegistry';

interface UPIStylePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  voter: Voter | null;
  onPinVerified: () => void;
}

export const UPIStylePinModal: React.FC<UPIStylePinModalProps> = ({
  isOpen,
  onClose,
  candidate,
  voter,
  onPinVerified,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsVerifying(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Support physical keyboard number input
  useEffect(() => {
    if (!isOpen || isSuccess || isVerifying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          handleDigitPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isSuccess, isVerifying]);

  if (!isOpen || !candidate || !voter) return null;

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg('');

    // If 6 digits reached, automatically submit
    if (newPin.length === 6) {
      submitPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const submitPin = (enteredPin: string) => {
    setIsVerifying(true);
    setErrorMsg('');

    setTimeout(() => {
      const verification = voterRegistryInstance.verifyVoterPin(voter.epicNumber, enteredPin);
      if (verification.verified) {
        setIsSuccess(true);
        setIsVerifying(false);
        setTimeout(() => {
          onPinVerified();
        }, 600);
      } else {
        setIsVerifying(false);
        setShake(true);
        setErrorMsg(verification.message);
        setTimeout(() => setShake(false), 500);
        setPin('');
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-title"
      >
        {/* UPI-Style Official Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 text-center relative border-b border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Cancel PIN entry"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="text-xl">🇮🇳</span>
            <div className="text-left">
              <span className="text-[10px] font-bold tracking-widest uppercase text-orange-400 block font-mono">
                Election Commission of India
              </span>
              <h2 id="pin-modal-title" className="text-sm font-bold text-white tracking-tight">
                Voter Security PIN Authentication
              </h2>
            </div>
          </div>
          <p className="text-[11px] text-slate-300">
            UPI-Grade Authentication for Ballot Secrecy & Immutability
          </p>
        </div>

        {/* Selected Candidate Ballot Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-2xl shrink-0">
              {candidate.symbol}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Casting Vote To
              </span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {candidate.name}
              </h3>
              <p className="text-xs text-slate-600">
                {candidate.party} · Serial #{candidate.serialNumber}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-500 block">Voter</span>
            <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
              {voter.fullName}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              {voter.epicNumber}
            </span>
          </div>
        </div>

        {/* PIN Entry Area */}
        <div className="p-6 space-y-6 flex-1 flex flex-col items-center">
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-slate-700">
              Enter 6-digit Secret Voter PIN
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Provided on your official ECI registration slip (like your UPI PIN)
            </p>
          </div>

          {/* 6 Masked PIN Indicator Dots */}
          <div className={`flex items-center justify-center gap-3.5 my-1 ${shake ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const filled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4.5 h-4.5 rounded-full transition-all duration-150 flex items-center justify-center ${
                    filled
                      ? isSuccess
                        ? 'bg-emerald-600 scale-110 shadow-xs ring-4 ring-emerald-100'
                        : 'bg-blue-600 scale-105 shadow-xs ring-4 ring-blue-100'
                      : 'border-2 border-slate-300 bg-white'
                  }`}
                >
                  {filled && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {errorMsg ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 w-full animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">{errorMsg}</p>
            </div>
          ) : isSuccess ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-center gap-2 w-full animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-xs">PIN Verified! Signing Ballot...</span>
            </div>
          ) : (
            /* Demo Helper Hint so user knows what PIN to enter */
            <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="text-[11px]">
                  Registered ECI PIN: <strong className="font-mono text-amber-950 font-bold tracking-wider">{voter.voterPin}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPin(voter.voterPin);
                  submitPin(voter.voterPin);
                }}
                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 hover:underline px-1.5 py-0.5 bg-amber-100/80 rounded"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {/* UPI-Grade Numeric Keypad */}
          <div className="w-full max-w-xs grid grid-cols-3 gap-2.5 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitPress(num.toString())}
                disabled={isVerifying || isSuccess}
                className="h-12 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-lg hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-2xs flex items-center justify-center select-none active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isVerifying || isSuccess || pin.length === 0}
              className="h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-xs hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-2xs flex items-center justify-center select-none disabled:opacity-40"
            >
              Clear
            </button>

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              disabled={isVerifying || isSuccess}
              className="h-12 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-lg hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-2xs flex items-center justify-center select-none active:scale-95 disabled:opacity-50"
            >
              0
            </button>

            {/* Backspace */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isVerifying || isSuccess || pin.length === 0}
              className="h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-2xs flex items-center justify-center select-none disabled:opacity-40"
              aria-label="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured under Election Commission of India Cryptographic Protocol</span>
        </div>
      </div>
    </div>
  );
};
