
import React, { useState, useRef, useEffect } from 'react';
import { District, Voter, RegistrationSource } from '../types';
import { UserPlus, Save, CheckCircle, Upload, AlertTriangle, Loader2, X, Smartphone, Globe, UserCog, ScanLine, MapPin, RefreshCw, FileText, CreditCard, Eye, AlertOctagon, Camera, Lock, Sparkles, Feather, PartyPopper } from 'lucide-react';
import { extractVoterData, sendToGoogleSheets, generateShammariPoem } from '../services/geminiService';

interface RegistrationFormProps {
  onAddVoter: (voter: Voter) => void;
  onRegistrationSuccess: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onAddVoter, onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    district: District.Tikrit,
    subClan: '',
    notes: '',
    source: 'mobile_app' as RegistrationSource,
    voterIdNumber: '',
    familyIdNumber: '',
    birthYear: ''
  });
  
  const [voterCardImage, setVoterCardImage] = useState<string | null>(null);
  const [voterCardBackImage, setVoterCardBackImage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [googleSheetStatus, setGoogleSheetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const [poetText, setPoetText] = useState<string>("");
  const [isPoetLoading, setIsPoetLoading] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [locationStatus, setLocationStatus] = useState<'idle' | 'checking' | 'success' | 'error' | 'out_of_bounds'>('idle');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = () => {
    setLocationStatus('checking');
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        const isInside = (latitude >= 33.0 && latitude <= 36.0 && longitude >= 42.0 && longitude <= 45.5);
        setLocationStatus(isInside ? 'success' : 'out_of_bounds');
      },
      () => setLocationStatus('error'),
      { timeout: 10000 }
    );
  };

  const handleFrontExtraction = async (base64: string) => {
    setIsValidating(true);
    setImageError(null);
    try {
      const result = await extractVoterData(base64.split(',')[1], 'image/jpeg', false);
      if (result.isValid && result.isSalahAlDin) {
        setFormData(prev => ({
          ...prev,
          fullName: result.fullName || prev.fullName,
          voterIdNumber: result.voterIdNumber || prev.voterIdNumber,
          district: (Object.values(District).find(d => result.district?.includes(d)) as District) || prev.district
        }));
      } else {
        setImageError(result.reason || "يجب تصوير وجه البطاقة (الذي يحتوي على الصورة الشخصية) حصراً.");
        setVoterCardImage(null);
      }
    } catch (e) {
      setImageError("حدث خطأ أثناء معالجة وجه البطاقة.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleBackExtraction = async (base64: string) => {
    setIsValidating(true);
    setImageError(null);
    try {
      const result = await extractVoterData(base64.split(',')[1], 'image/jpeg', true);
      if (result.isValid) {
        setFormData(prev => ({
          ...prev,
          voterIdNumber: result.voterIdNumber || prev.voterIdNumber,
          familyIdNumber: result.familyIdNumber || prev.familyIdNumber,
          birthYear: result.birthYear || prev.birthYear
        }));
      } else {
        setImageError(result.reason || "يجب تصوير ظهر البطاقة (الذي يحتوي على الباركود) حصراً.");
        setVoterCardBackImage(null);
      }
    } catch (e) {
      setImageError("حدث خطأ أثناء معالجة ظهر البطاقة.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      setVoterCardImage(base64);
      handleFrontExtraction(base64);
    };
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      setVoterCardBackImage(base64);
      handleBackExtraction(base64);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locationStatus !== 'success') return;
    
    setImageError(null);
    setPhoneError(null);
    setNameError(null);

    if (!voterCardImage || !voterCardBackImage) { 
      setImageError("يجب تصوير وجه وظهر البطاقة لإكمال التسجيل."); 
      return; 
    }
    
    const nameParts = formData.fullName.trim().split(/\s+/).filter(p => p.length > 1);
    if (nameParts.length < 3) { 
      setNameError("يرجى إدخال الاسم الثلاثي على الأقل كما هو مكتوب في البطاقة."); 
      return; 
    }

    const phoneRegex = /^(077|078|079)\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setPhoneError("يرجى إدخال رقم هاتف صالح يتكون من 11 رقماً ويبدأ بـ (077، 078، 079).");
      return;
    }

    const voterData: Voter = {
      id: Date.now().toString(),
      ...formData,
      voterCardImage,
      voterCardBackImage: voterCardBackImage || undefined,
      registeredAt: new Date().toISOString(),
      gpsLat: locationCoords?.lat,
      gpsLng: locationCoords?.lng
    };

    setGoogleSheetStatus('sending');
    const sheetResponse = await sendToGoogleSheets(voterData);
    if (sheetResponse.success) {
      setGoogleSheetStatus('sent');
      onAddVoter(voterData);
      setSuccess(true);
      onRegistrationSuccess(); 
      
      setFormData({ fullName: '', phone: '', district: District.Tikrit, subClan: '', notes: '', source: 'mobile_app', voterIdNumber: '', familyIdNumber: '', birthYear: '' });
      setVoterCardImage(null); setVoterCardBackImage(null);
      setTimeout(() => { setSuccess(false); setGoogleSheetStatus('idle'); }, 8000);
    } else {
      setGoogleSheetStatus('error');
    }
  };

  if (locationStatus !== 'success') {
    return (
      <div className="bg-white rounded-xl shadow-xl p-8 text-center border-t-4 border-gray-400">
        <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800">يتطلب الوصول للموقع الجغرافي</h3>
        <p className="text-gray-600 mt-2 mb-4">يجب أن تكون متواجداً في محافظة صلاح الدين وتفعيل الـ GPS لإتمام العملية.</p>
        <button onClick={checkLocation} className="bg-red-800 text-white px-6 py-2 rounded-lg font-bold">إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-shammari-red animate-fade-in-up">
      <div className="p-5 md:p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-shammari-red" /> تسجيل ناخب جديد
        </h2>
        <div className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
          <MapPin className="w-3 h-3" /> الموقع نشط
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
        {success && (
          <div className="bg-green-600 text-white p-6 rounded-2xl flex flex-col items-center gap-3 border border-green-700 animate-scale-in shadow-xl text-center">
            <PartyPopper className="w-12 h-12 text-yellow-300" />
            <div className="space-y-1">
               <h3 className="text-2xl font-black italic">الان تستطيع التصويت مرحبا بك</h3>
               <p className="text-sm text-green-50 font-medium">تم تسجيل بياناتك بنجاح في سجل قبيلة شمر.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-shammari-red" /> صور بطاقة الناخب
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Front Card Scanner */}
            <div onClick={() => frontInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${voterCardImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-shammari-red hover:bg-red-50'}`}>
              {!voterCardImage ? (
                <>
                  <Camera className="w-10 h-10 text-shammari-red mb-2" />
                  <span className="text-sm font-bold">الوجه الأمامي</span>
                  <span className="text-[10px] text-gray-400 font-bold">التي تحتوي على صورتك الشخصية</span>
                </>
              ) : (
                <div className="relative">
                  <img src={voterCardImage} className="max-h-32 rounded shadow-sm border border-green-200" />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md"><CheckCircle className="w-4 h-4"/></div>
                </div>
              )}
              <input ref={frontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFrontUpload} />
            </div>

            {/* Back Card Scanner */}
            <div onClick={() => backInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${voterCardBackImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-shammari-red hover:bg-red-50'}`}>
              {!voterCardBackImage ? (
                <>
                  <ScanLine className="w-10 h-10 text-gray-600 mb-2" />
                  <span className="text-sm font-bold">ظهر البطاقة</span>
                  <span className="text-[10px] text-gray-400 font-bold">التي تحتوي على الباركود والأرقام</span>
                </>
              ) : (
                <div className="relative">
                  <img src={voterCardBackImage} className="max-h-32 rounded shadow-sm border border-green-200" />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md"><CheckCircle className="w-4 h-4"/></div>
                </div>
              )}
              <input ref={backInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBackUpload} />
            </div>
          </div>
          {isValidating && <div className="text-center py-2 text-shammari-red text-xs font-bold animate-pulse flex items-center justify-center gap-2 bg-red-50 rounded-lg">
            <Loader2 className="w-3 h-3 animate-spin"/> جاري التحقق من صحة البطاقة...
          </div>}
          {imageError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg text-center font-bold border border-red-100 animate-shake">{imageError}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">الاسم الثلاثي (من البطاقة)</label>
            <input required type="text" value={formData.fullName} onChange={(e) => {setFormData({...formData, fullName: e.target.value}); setNameError(null);}} className={`w-full px-4 py-3 rounded-lg border ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-800'} focus:ring-2 outline-none font-bold`} placeholder="الاسم الثلاثي كما هو في البطاقة" />
            {nameError && <p className="text-xs text-red-600 font-bold">{nameError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">رقم الهاتف (آسيا أو زين)</label>
            <input 
              required 
              type="tel" 
              maxLength={11} 
              value={formData.phone} 
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({...formData, phone: val});
                setPhoneError(null);
              }} 
              className={`w-full px-4 py-3 border ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-800'} rounded-lg outline-none font-bold tracking-widest text-center`} 
              placeholder="077XXXXXXXX" 
              dir="ltr"
            />
            {phoneError && <p className="text-xs text-red-600 font-bold">{phoneError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">المنطقة</label>
            <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value as District})} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-white font-bold">
              {Object.values(District).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">العشيرة</label>
            <select required value={formData.subClan} onChange={(e) => setFormData({...formData, subClan: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-white font-bold">
              <option value="">-- اختر --</option>
              <option value="الأسلم">الأسلم</option>
              <option value="سنجارة">سنجارة</option>
              <option value="عبدة">عبدة</option>
              <option value="الصايح">الصايح</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">رقم الناخب</label>
            <input type="text" value={formData.voterIdNumber} onChange={(e) => setFormData({...formData, voterIdNumber: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono font-bold" placeholder="XXXXXXXX" readOnly />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">رقم العائلة</label>
              <input type="text" value={formData.familyIdNumber} onChange={(e) => setFormData({...formData, familyIdNumber: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono font-bold" readOnly />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">المواليد</label>
              <input type="text" maxLength={4} value={formData.birthYear} onChange={(e) => setFormData({...formData, birthYear: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono font-bold" readOnly />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-xl text-center shadow-inner">
          <p className="text-xl font-black text-red-900 italic mb-4">"{poetText || "شاعر القبيلة يرحب بكم.."}"</p>
          <button type="button" onClick={async () => {setIsPoetLoading(true); setPoetText(await generateShammariPoem()); setIsPoetLoading(false);}} className="text-xs bg-red-800 text-white px-6 py-2.5 rounded-full flex items-center gap-2 mx-auto font-bold shadow-md hover:bg-red-900 transition-colors">
            {isPoetLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4"/>} استدعاء الشاعر
          </button>
        </div>

        <button type="submit" disabled={isValidating || googleSheetStatus === 'sending'} className="w-full bg-shammari-red text-white font-black py-4 rounded-xl shadow-xl hover:bg-red-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 text-lg">
          {googleSheetStatus === 'sending' ? <Loader2 className="animate-spin w-6 h-6"/> : <Save className="w-6 h-6"/>}
          {googleSheetStatus === 'sending' ? 'جاري إرسال البيانات...' : 'حفظ وإرسال البيانات'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;
