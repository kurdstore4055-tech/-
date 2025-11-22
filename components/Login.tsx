import React, { useState, useEffect, useRef } from 'react';
import { ShammariLogo } from './Icons';
import { Mail, Lock, LogIn, Smartphone, QrCode, X, Share2, Download, ScanFace, Camera, AlertOctagon, Loader2, ShieldCheck } from 'lucide-react';
import { extractVoterData } from '../services/geminiService';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'cptstaf2017@gmail.com';
const ADMIN_PASS = 'Saad0770$';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'card' | 'admin'>('card'); // Default to Card Scan
  
  // Admin State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Card Scan State
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // QR Code State
  const [showQR, setShowQR] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowQR(false);
  };

  // --- Admin Login Logic ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const input = identifier.trim();
      
      // Strict Check: ONLY the Admin Email is allowed
      if (input === ADMIN_EMAIL && password === ADMIN_PASS) {
        localStorage.setItem('shammari_user_email', ADMIN_EMAIL);
        onLoginSuccess();
      } else {
        setError('عذراً، بيانات المسؤول غير صحيحة.');
        setIsLoading(false);
      }
    }, 800);
  };

  // --- Card Login Logic ---
  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError('');
    setCardImage(null);

    // 1. Read File
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;
      setCardImage(base64String); // Show preview

      try {
        // 2. Send to AI for Validation (Salah al-Din Check)
        // We treat this as "Front Image"
        const result = await extractVoterData(base64String.split(',')[1], 'image/jpeg');

        if (result.isValid) {
           // SUCCESS: Card is from Salah al-Din
           localStorage.setItem('shammari_user_email', 'guest_card_user'); // Generic user session
           setTimeout(() => {
             onLoginSuccess();
           }, 1000); // Small delay to show success state
        } else {
           // FAILURE: Not Salah al-Din or Invalid
           setError(result.reason || "البطاقة غير صالحة للدخول.");
           setIsAnalyzing(false);
        }
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء فحص البطاقة.");
        setIsAnalyzing(false);
      }
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-cairo p-4 relative overflow-hidden">
        {/* Animated Gradient Blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-red-800 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 -left-4 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-red-800" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">تثبيت التطبيق</h3>
            <p className="text-sm text-gray-500 mb-4">
              {deferredPrompt ? 'اضغط على الزر أدناه لتثبيت التطبيق على هاتفك.' : 'امسح الرمز لفتح التطبيق، ثم اتبع التعليمات.'}
            </p>

            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-red-800 text-white font-bold py-3 rounded-xl mb-4 flex items-center justify-center gap-2 shadow-lg animate-pulse hover:bg-red-900 transition"
              >
                <Download className="w-5 h-5" /> تثبيت التطبيق الآن
              </button>
            )}
            
            <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-inner inline-block mb-4">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff`} 
                 alt="App QR Code" 
                 className="w-40 h-40 object-contain"
               />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 text-right">
               <p className="font-bold mb-2 border-b border-gray-200 pb-1">طريقة التثبيت اليدوي:</p>
               {isIOS ? (
                  <div className="flex items-start gap-2 mb-2">
                    <span className="bg-gray-200 rounded px-1 text-[10px]">iOS</span>
                    <p>Safari: اضغط <Share2 className="w-3 h-3 inline mx-1"/> واختر <strong>"Add to Home Screen"</strong>.</p>
                  </div>
               ) : (
                  <div className="flex items-start gap-2">
                    <span className="bg-gray-200 rounded px-1 text-[10px]">Android</span>
                    <p>Chrome: القائمة (⋮) ثم <strong>"Install App"</strong>.</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md transition-all duration-500">
        <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-lg relative">
                <ShammariLogo className="w-16 h-16 drop-shadow-md" />
                <div className="absolute -bottom-2 bg-yellow-500 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-900">
                  نسخة صلاح الدين
                </div>
            </div>
            <h1 className="text-3xl font-black text-white mt-4">شمر <span className="text-yellow-400">تنتخب</span></h1>
            <p className="text-red-200 mt-2 text-xs font-bold tracking-wide">
              الانتخابات التمهيدية لقبيلة شمر في صلاح الدين
            </p>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-gray-700/50 relative overflow-hidden">
            
            {/* Tabs to Switch Modes */}
            <div className="flex justify-center mb-6 bg-gray-900/50 p-1 rounded-lg mx-auto w-fit">
               <button 
                 onClick={() => { setLoginMode('card'); setError(''); }}
                 className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${loginMode === 'card' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
               >
                 دخول ببطاقة الناخب
               </button>
               <button 
                 onClick={() => { setLoginMode('admin'); setError(''); }}
                 className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${loginMode === 'admin' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
               >
                 دخول مسؤول
               </button>
            </div>

            {loginMode === 'card' ? (
              /* --- CARD SCAN LOGIN --- */
              <div className="animate-fade-in-up text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">مسح بطاقة الناخب</h2>
                    <p className="text-gray-400 text-xs">
                      لفتح التطبيق، يرجى تصوير بطاقة ناخب تابعة لمحافظة 
                      <span className="text-yellow-400 font-bold mx-1">صلاح الدين</span>
                      حصراً.
                    </p>
                  </div>

                  <div className="relative">
                     <div 
                       onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                       className={`
                         border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
                         ${isAnalyzing ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-500 bg-gray-800/50 hover:border-red-500 hover:bg-red-500/10'}
                         ${error ? 'border-red-500 bg-red-900/20' : ''}
                       `}
                     >
                        {isAnalyzing ? (
                          <div className="flex flex-col items-center py-4">
                             <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
                             <p className="text-yellow-500 font-bold animate-pulse">جاري التحقق من صلاح الدين...</p>
                          </div>
                        ) : cardImage ? (
                          <div className="relative w-full">
                             <img src={cardImage} alt="Card Preview" className="rounded-lg max-h-40 mx-auto object-contain shadow-lg opacity-50" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                             </div>
                          </div>
                        ) : (
                          <>
                             <div className="w-20 h-20 bg-red-800 rounded-full flex items-center justify-center shadow-lg mb-4 animate-pulse">
                                <Camera className="w-10 h-10 text-white" />
                             </div>
                             <p className="text-white font-bold">اضغط لتشغيل الكاميرا</p>
                             <p className="text-xs text-gray-500 mt-2">التقط صورة واضحة للوجه الأمامي</p>
                          </>
                        )}
                     </div>
                     <input 
                       ref={fileInputRef}
                       type="file" 
                       accept="image/*" 
                       capture="environment" 
                       className="hidden" 
                       onChange={handleCardUpload} 
                     />
                  </div>

                  {error && (
                    <div className="text-red-200 text-xs bg-red-900/40 p-3 rounded-lg border border-red-800/50 flex items-center gap-2 animate-scale-in">
                      <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="font-bold">{error}</span>
                    </div>
                  )}
              </div>

            ) : (
              /* --- ADMIN LOGIN --- */
              <form onSubmit={handleAdminLogin} className="space-y-5 animate-fade-in-up">
                  <div>
                    <label className="text-sm font-bold text-gray-300 mb-2 block">الحساب (إيميل المسؤول)</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-xl text-white px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-red-600 transition placeholder-gray-500"
                        placeholder="admin@gmail.com"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-300 mb-2 block">كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-xl text-white px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-red-600 transition placeholder-gray-500"
                        placeholder="••••••••••"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-200 text-sm bg-red-900/40 p-3 rounded-lg border border-red-800/50 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin h-5 w-5" />
                            <span>جاري التحقق...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5" />
                            <span>دخول المسؤول</span>
                        </>
                    )}
                  </button>
              </form>
            )}
        </div>
        
        {/* Direct Install / QR Code Button */}
        <div className="mt-8 flex justify-center">
          {deferredPrompt ? (
             <button 
                onClick={handleInstallClick}
                className="flex items-center gap-2 text-white transition-colors text-sm font-bold bg-yellow-600 hover:bg-yellow-500 px-6 py-3 rounded-full shadow-lg animate-pulse"
              >
                <Download className="w-4 h-4" />
                تثبيت التطبيق الآن
              </button>
          ) : (
              <button 
                onClick={() => setShowQR(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium bg-gray-800/40 px-4 py-2 rounded-full border border-gray-700"
              >
                <QrCode className="w-4 h-4" />
                تحميل التطبيق (QR Code)
              </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
            © {new Date().getFullYear()} نظام آمن لإدارة الناخبين - صلاح الدين.
        </p>
      </div>
      <style>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: -2s;
        }
        .animation-delay-4000 {
          animation-delay: -4s;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Login;