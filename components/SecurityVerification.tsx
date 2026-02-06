
import React, { useState, useRef } from 'react';
import { Camera, ShieldCheck, AlertOctagon, Loader2, LogOut, ArrowRight, Scan, CreditCard, Info, FileText, UserSquare } from 'lucide-react';
import { extractVoterData } from '../services/geminiService';

interface SecurityVerificationProps {
  onVerified: () => void;
  onLogout: () => void;
}

const SecurityVerification: React.FC<SecurityVerificationProps> = ({ onVerified, onLogout }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        // نمرر false للدلالة على فحص وجه البطاقة (الأمامية)
        const result = await extractVoterData(base64, 'image/jpeg', false);
        
        if (result.isValid && result.isSalahAlDin) {
          onVerified();
        } else {
          setError(result.reason || "عذراً، يجب تصوير واجهة بطاقة الناخب (الجهة الأمامية) والتأكد أنها تابعة لصلاح الدين.");
        }
      } catch (err) {
        setError("فشل الاتصال بنظام التحقق. تأكد من جودة الصورة وحاول مجدداً.");
      } finally {
        setIsVerifying(false);
      }
    };
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-cairo relative overflow-hidden">
      {/* Decorative Red/White BG */}
      <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-shammari-red rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-shammari-red rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10 text-center animate-scale-in">
        <div className="w-24 h-24 bg-shammari-red/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-shammari-red/10">
          <UserSquare className="w-12 h-12 text-shammari-red" />
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 mb-2">التحقق من الهوية</h2>
        <p className="text-gray-500 mb-10 text-sm font-medium">يرجى تصوير <span className="text-shammari-red font-bold">واجهة البطاقة</span> لفتح النظام</p>

        <div className={`bg-gray-50 border-2 border-dashed rounded-[3rem] p-10 mb-8 flex flex-col items-center justify-center relative group transition-all duration-500 overflow-hidden ${isVerifying ? 'border-shammari-red bg-red-50/30 shadow-inner' : 'border-gray-200 hover:border-shammari-red hover:bg-white shadow-xl shadow-gray-100'}`}>
          
          {/* Scan Guide Overlay */}
          <div className="absolute inset-4 border-2 border-white/40 rounded-[2rem] pointer-events-none flex items-center justify-center opacity-30">
             <div className="w-full h-[2px] bg-shammari-red absolute top-1/2 -translate-y-1/2 animate-scan"></div>
          </div>

          {isVerifying ? (
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-shammari-red animate-spin" />
                <CreditCard className="w-6 h-6 text-shammari-red absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="font-black text-shammari-red text-lg">جاري فحص الواجهة...</p>
              <p className="text-xs text-gray-400">يتم استخراج البيانات والتحقق من المحافظة</p>
            </div>
          ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-6 relative z-10"
            >
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-gray-50">
                <Scan className="w-10 h-10 text-shammari-red" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-gray-800 text-lg">صور واجهة البطاقة</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-bold">Voter Card Front Only</p>
              </div>
            </button>
          )}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleScan}
          />
        </div>

        {/* Requirements Tips */}
        <div className="mb-8 flex items-start gap-3 bg-red-50/40 p-4 rounded-2xl border border-red-100 text-right">
           <AlertOctagon className="w-5 h-5 text-shammari-red shrink-0 mt-0.5" />
           <div className="space-y-1">
              <p className="text-xs font-bold text-red-900">تعليمات أمنية:</p>
              <ul className="text-[10px] text-red-700 space-y-1 list-disc list-inside font-bold">
                <li>صور الجهة الأمامية للبطاقة (التي تحتوي على الصورة).</li>
                <li>تأكد من وضوح اسم المحافظة (صلاح الدين).</li>
                <li>اجعل البطاقة تتوسط الإطار وتحت إضاءة جيدة.</li>
              </ul>
           </div>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-200 p-5 rounded-2xl flex items-center gap-4 text-red-800 text-xs font-black mb-10 animate-shake shadow-lg">
            <AlertOctagon className="w-7 h-7 shrink-0 text-red-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-8">
           <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-shammari-red font-black text-sm transition group"
           >
             <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> خروج المسؤول
           </button>
           <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full text-[10px] font-black border border-green-100 shadow-sm">
             <ShieldCheck className="w-4 h-4" /> فحص ذكاء اصطناعي
           </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SecurityVerification;
