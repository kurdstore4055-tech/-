import React, { useState, useRef, useEffect } from 'react';
import { District, Voter, RegistrationSource } from '../types';
import { UserPlus, Save, CheckCircle, Upload, AlertTriangle, Loader2, X, Smartphone, Globe, UserCog, ScanLine, MapPin, RefreshCw, FileText, CreditCard, Eye, AlertOctagon, Camera, Lock, Sparkles, Feather } from 'lucide-react';
import { extractVoterData, sendToGoogleSheets, generateShammariPoem } from '../services/geminiService';

interface RegistrationFormProps {
  onAddVoter: (voter: Voter) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onAddVoter }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '', // Will be constructed from prefix + number
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
  const [extractionDone, setExtractionDone] = useState(false);

  // Poet Bot State
  const [poetText, setPoetText] = useState<string>("");
  const [isPoetLoading, setIsPoetLoading] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Location States
  const [locationStatus, setLocationStatus] = useState<'idle' | 'checking' | 'success' | 'error' | 'out_of_bounds'>('idle');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string>("");

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = () => {
    setLocationStatus('checking');
    setLocationErrorMsg("");

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationErrorMsg("المتصفح لا يدعم خدمة تحديد الموقع.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });

        // Salah al-Din Approximate Bounding Box
        const isInside = (
          latitude >= 33.0 && latitude <= 36.0 &&
          longitude >= 42.0 && longitude <= 45.5
        );

        if (isInside) {
          setLocationStatus('success');
        } else {
          setLocationStatus('out_of_bounds');
        }
      },
      (error) => {
        console.error("GPS Error Details:", error.code, error.message);
        let msg = "تعذر تحديد الموقع.";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                msg = "تم رفض إذن الوصول للموقع. يرجى تفعيله من إعدادات المتصفح.";
                break;
            case error.POSITION_UNAVAILABLE:
                msg = "معلومات الموقع غير متوفرة حالياً (تأكد من تشغيل GPS).";
                break;
            case error.TIMEOUT:
                msg = "انتهت مهلة تحديد الموقع. الشبكة ضعيفة.";
                break;
            default:
                msg = `خطأ غير معروف: ${error.message}`;
        }
        setLocationErrorMsg(msg);
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const triggerExtraction = async () => {
    if (!voterCardImage) return;
    
    const frontBase64 = voterCardImage.split(',')[1];
    const backBase64 = voterCardBackImage ? voterCardBackImage.split(',')[1] : undefined;
    const mimeType = 'image/jpeg'; // Assuming JPEG for simplicity or extract from string

    setIsValidating(true);
    setImageError(null);
    setExtractionDone(false);

    try {
      const result = await extractVoterData(frontBase64, mimeType, backBase64);

      if (result.isValid) {
        let newDistrict = formData.district;
        
        if (result.district) {
          const matchedDistrict = Object.values(District).find(d => d === result.district || result.district?.includes(d));
          if (matchedDistrict) {
            newDistrict = matchedDistrict as District;
          }
        }

        setFormData(prev => ({
          ...prev,
          fullName: result.fullName || prev.fullName,
          district: newDistrict,
          voterIdNumber: result.voterIdNumber || prev.voterIdNumber,
          familyIdNumber: result.familyIdNumber || prev.familyIdNumber,
          birthYear: result.birthYear || prev.birthYear
        }));
        setExtractionDone(true);
      } else {
        // Explicit rejection logic if AI says it's not a valid FRONT card or WRONG GOVERNORATE
        // Use the specific reason returned from the AI service
        const errorMsg = result.reason || "عذراً، البطاقة غير مقبولة. يجب أن تكون بطاقة ناخب صادرة من محافظة صلاح الدين حصراً.";
        setImageError(errorMsg);
        
        // Clear the invalid image to allow user to re-upload
        setVoterCardImage(null);
        if (frontInputRef.current) frontInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
      setImageError("حدث خطأ في المعالجة.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleGeneratePoem = async () => {
    setIsPoetLoading(true);
    const poem = await generateShammariPoem();
    setPoetText(poem);
    setIsPoetLoading(false);
  };

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      setVoterCardImage(base64String);
      setImageError(null); // Clear previous errors
      // Reset extraction status when new image is loaded
      setExtractionDone(false);
    };
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      setVoterCardBackImage(base64String);
      setExtractionDone(false);
    };
  };

  // Auto-trigger extraction when both images are present or if just front is present after a delay?
  // Better UX: Trigger manually or automatically after a short debounce if Front is present.
  useEffect(() => {
    if (voterCardImage && !extractionDone && !isValidating) {
      // If back image is missing, maybe wait a bit? 
      // Let's trigger immediately, re-trigger if back is added.
      const timer = setTimeout(() => {
        triggerExtraction();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [voterCardImage, voterCardBackImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setPhoneError(null);
    setNameError(null);
    
    if (locationStatus !== 'success') {
      alert("لا يمكن الحفظ: الموقع الجغرافي غير صالح.");
      return;
    }

    if (!voterCardImage) {
      setImageError("يرجى إرفاق وجه البطاقة على الأقل.");
      return;
    }

    // Validate Name (Must be Quadruple - 4 words minimum)
    const nameParts = formData.fullName.trim().split(/\s+/).filter(part => part.length > 1);
    if (nameParts.length < 4) {
      setNameError("يجب إدخال الاسم الرباعي كاملاً (4 أسماء) بدون اللقب.");
      return;
    }

    // Validate Phone on Submit
    if (formData.phone.length !== 11) {
      setPhoneError("رقم الهاتف يجب أن يتكون من 11 رقماً");
      return;
    }
    const prefix = formData.phone.substring(0, 3);
    if (!['077', '078', '079', '075'].includes(prefix)) {
      setPhoneError("الشبكات المسموحة فقط: آسيا (077)، زين (078, 079)، كورك (075)");
      return;
    }

    const voterData: Voter = {
      id: Date.now().toString(),
      ...formData,
      voterCardImage,
      voterCardBackImage: voterCardBackImage || undefined,
      registeredAt: new Date().toISOString()
    };

    setGoogleSheetStatus('sending');

    // Send to Google Sheets and Wait for the URL (Link)
    // This allows us to store the generated Drive Link in our local state for exporting.
    const sheetResponse = await sendToGoogleSheets(voterData);

    if (sheetResponse.success) {
      setGoogleSheetStatus('sent');
      // Update voter data with the Cloud URLs if available
      if (sheetResponse.frontUrl) voterData.frontImageUrl = sheetResponse.frontUrl;
      if (sheetResponse.backUrl) voterData.backImageUrl = sheetResponse.backUrl;
    } else {
      setGoogleSheetStatus('error');
    }

    // Add to Local State (Dashboard)
    onAddVoter(voterData);
    setSuccess(true);
    
    // Reset form
    setFormData({
      fullName: '',
      phone: '',
      district: District.Tikrit,
      subClan: '',
      notes: '',
      source: 'mobile_app',
      voterIdNumber: '',
      familyIdNumber: '',
      birthYear: ''
    });
    setPhoneError(null);
    setNameError(null);
    setVoterCardImage(null);
    setVoterCardBackImage(null);
    setExtractionDone(false);
    setPoetText(""); // Reset poet text
    if (frontInputRef.current) frontInputRef.current.value = '';
    if (backInputRef.current) backInputRef.current.value = '';

    setTimeout(() => {
      setSuccess(false);
      setGoogleSheetStatus('idle');
    }, 4000);
  };

  // GPS Blocking UI
  if (locationStatus !== 'success') {
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-gray-400 p-8 text-center">
        {locationStatus === 'checking' && (
          <div className="flex flex-col items-center animate-pulse">
            <MapPin className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">جاري التحقق من الموقع الجغرافي...</h3>
            <p className="text-gray-500 mt-2">يرجى الانتظار، يتم التأكد من تواجدك داخل صلاح الدين.</p>
          </div>
        )}

        {locationStatus === 'error' && (
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
            <h3 className="text-xl font-bold text-red-700">فشل تحديد الموقع</h3>
            <p className="text-gray-600 mt-2 mb-4">
               {locationErrorMsg || "لأسباب أمنية، يتطلب التطبيق تفعيل GPS للتأكد من أن التسجيل يتم داخل محافظة صلاح الدين حصراً."}
            </p>
            <button 
              onClick={checkLocation}
              className="flex items-center gap-2 bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 transition"
            >
              <RefreshCw className="w-4 h-4" /> إعادة المحاولة
            </button>
          </div>
        )}

        {locationStatus === 'out_of_bounds' && (
          <div className="flex flex-col items-center">
            <MapPin className="w-12 h-12 text-red-600 mb-4" />
            <h3 className="text-xl font-bold text-red-700">خارج النطاق الجغرافي</h3>
            <p className="text-gray-600 mt-2 mb-1">
              عذراً، هذا التطبيق مخصص للاستخدام حصراً داخل حدود <strong>محافظة صلاح الدين</strong>.
            </p>
            {locationCoords && (
              <p className="text-xs text-gray-400 mb-4 dir-ltr">
                Location: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
              </p>
            )}
            <button 
              onClick={checkLocation}
              className="flex items-center gap-2 bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition"
            >
              <RefreshCw className="w-4 h-4" /> تحديث الموقع
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-shammari-red">
      <div className="p-5 md:p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-shammari-red" />
          تسجيل ناخب جديد
        </h2>
        <div className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
          <MapPin className="w-3 h-3" /> الموقع نشط
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
        {success && (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg flex flex-col gap-1 animate-fade-in border border-green-200">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle className="w-5 h-5 shrink-0" />
              تم حفظ البيانات محلياً.
            </div>
            {googleSheetStatus === 'sent' && <p className="text-xs opacity-80 mr-7">تم الحفظ في قاعدة البيانات (Google Sheets).</p>}
            {googleSheetStatus === 'sending' && <p className="text-xs opacity-80 mr-7 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> جاري الاتصال بقاعدة البيانات...</p>}
            {googleSheetStatus === 'error' && <p className="text-xs text-red-600 mr-7">تنبيه: لم يتم الحفظ في السحابة (تحقق من إعدادات السكربت)، لكن تم الحفظ محلياً.</p>}
          </div>
        )}

        {/* Unified Voter Card Upload Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-shammari-red" /> صور بطاقة الناخب
            </label>
            {(voterCardImage || voterCardBackImage) && !isValidating && (
              <button 
                type="button" 
                onClick={triggerExtraction}
                className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> إعادة قراءة البيانات
              </button>
            )}
          </div>

          {/* Merged Card Container */}
          <div className={`border-2 border-dashed rounded-2xl transition-colors relative overflow-hidden ${imageError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-red-200 hover:bg-red-50/30'}`}>
            
            <div className="flex flex-col md:flex-row md:divide-x md:divide-x-reverse divide-y md:divide-y-0 divide-gray-200">
              
              {/* Front Section */}
              <div className="flex-1 relative group">
                <div 
                  className="p-6 flex flex-col items-center justify-center min-h-[180px] cursor-pointer transition-transform active:scale-[0.98]"
                  onClick={() => frontInputRef.current?.click()}
                >
                  {!voterCardImage ? (
                    <>
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                         <Camera className="w-8 h-8 text-red-700" />
                       </div>
                       <p className="text-sm font-bold text-gray-800">الوجه الأمامي</p>
                       <p className="text-xs text-red-600 mt-1 font-bold bg-red-100 px-2 py-0.5 rounded">حصراً بطاقة صلاح الدين</p>
                    </>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img src={voterCardImage} className="max-h-40 object-contain rounded shadow-sm" />
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold shadow-sm">تم الرفع</div>
                    </div>
                  )}
                </div>
                {voterCardImage && (
                   <button type="button" onClick={(e) => {e.stopPropagation(); setVoterCardImage(null); if(frontInputRef.current) frontInputRef.current.value=''}} className="absolute top-2 left-2 bg-white/80 hover:bg-red-100 text-red-600 rounded-full p-1.5 shadow-sm transition"><X className="w-4 h-4"/></button>
                )}
                <input ref={frontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFrontUpload} />
              </div>

              {/* Back Section */}
              <div className="flex-1 relative group">
                <div 
                  className="p-6 flex flex-col items-center justify-center min-h-[180px] cursor-pointer transition-transform active:scale-[0.98]"
                  onClick={() => backInputRef.current?.click()}
                >
                  {!voterCardBackImage ? (
                    <>
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                         <ScanLine className="w-8 h-8 text-gray-600" />
                       </div>
                       <p className="text-sm font-bold text-gray-800">ظهر البطاقة</p>
                       <p className="text-xs text-gray-500 mt-1">رقم الناخب والعائلة</p>
                    </>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img src={voterCardBackImage} className="max-h-40 object-contain rounded shadow-sm" />
                      <div className="absolute top-0 right-0 bg-gray-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold shadow-sm">تم الرفع</div>
                    </div>
                  )}
                </div>
                {voterCardBackImage && (
                   <button type="button" onClick={(e) => {e.stopPropagation(); setVoterCardBackImage(null); if(backInputRef.current) backInputRef.current.value=''}} className="absolute top-2 left-2 bg-white/80 hover:bg-red-100 text-red-600 rounded-full p-1.5 shadow-sm transition"><X className="w-4 h-4"/></button>
                )}
                <input ref={backInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBackUpload} />
              </div>

            </div>
            
            {/* Connecting Label (Badge in center) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 shadow-sm hidden md:block z-10">
               +
            </div>
          </div>

          {/* Validation Status */}
          {isValidating && (
             <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded text-sm justify-center animate-pulse border border-red-100">
               <Loader2 className="w-4 h-4 animate-spin" /> جاري التحقق من صلاحية البطاقة...
             </div>
          )}
          {imageError && (
            <div className="flex items-center gap-2 justify-center text-red-600 text-xs font-bold bg-red-50 p-2 rounded animate-pulse">
              <AlertOctagon className="w-4 h-4" /> {imageError}
            </div>
          )}
        </div>

        {/* Extracted Data Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">الاسم الرباعي (بدون لقب)</label>
            <input 
              required 
              type="text" 
              value={formData.fullName} 
              onChange={(e) => {
                setFormData({...formData, fullName: e.target.value});
                if (e.target.value.trim().split(/\s+/).length >= 4) setNameError(null);
              }} 
              className={`w-full px-4 py-3 rounded-lg border ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-800'} bg-yellow-50 focus:ring-2 outline-none`} 
              placeholder="مثال: محمد أحمد محمود علي" 
            />
            {nameError && <p className="text-xs text-red-600 font-bold animate-pulse">{nameError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">رقم الهاتف</label>
            {/* Strict Phone Input with Prefix Selector */}
            <div className="flex gap-2" dir="ltr">
              <select 
                value={formData.phone.length >= 3 ? formData.phone.substring(0, 3) : '077'}
                onChange={(e) => {
                  const prefix = e.target.value;
                  const number = formData.phone.length >= 3 ? formData.phone.substring(3) : '';
                  setFormData({...formData, phone: prefix + number});
                }}
                className="w-[140px] px-2 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-red-800 outline-none text-sm font-bold"
              >
                <option value="077">077 (Asiacell)</option>
                <option value="078">078 (Zain)</option>
                <option value="079">079 (Zain)</option>
                <option value="075">075 (Korek)</option>
              </select>
              <input 
                required 
                type="tel" 
                value={formData.phone.length >= 3 ? formData.phone.substring(3) : ''} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length > 8) return; // Limit strictly to 8
                  const currentPrefix = formData.phone.length >= 3 ? formData.phone.substring(0, 3) : '077';
                  setFormData({...formData, phone: currentPrefix + val});
                  
                  // Instant validation feedback
                  if (val.length > 0 && val.length < 8) {
                     setPhoneError("الرقم يجب أن يكون 8 مراتب");
                  } else {
                     setPhoneError(null);
                  }
                }} 
                className={`flex-1 px-4 py-3 rounded-lg border ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-800'} focus:ring-2 outline-none text-lg tracking-widest font-bold placeholder-gray-300`} 
                placeholder="12345678" 
                maxLength={8}
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-600 font-bold animate-pulse">{phoneError}</p>
            )}
          </div>

          {/* Fixed Governorate Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">المحافظة</label>
            <div className="relative">
               <input 
                 type="text" 
                 value="صلاح الدين" 
                 readOnly 
                 className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-bold outline-none cursor-not-allowed"
               />
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">المنطقة</label>
            <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value as District})} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-800 outline-none bg-white">
              {Object.values(District).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">العشيرة / الفخذ</label>
            <select 
              required 
              value={formData.subClan} 
              onChange={(e) => setFormData({...formData, subClan: e.target.value})} 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-800 outline-none bg-white"
            >
              <option value="">-- اختر العشيرة --</option>
              <option value="الأسلم">الأسلم</option>
              <option value="سنجارة">سنجارة</option>
              <option value="عبدة">عبدة</option>
              <option value="الصايح">الصايح</option>
            </select>
          </div>

          {/* New Detailed Fields - Enforced Numeric */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1"><FileText className="w-3 h-3"/> رقم الناخب (من ظهر البطاقة)</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={formData.voterIdNumber} 
              onChange={(e) => setFormData({...formData, voterIdNumber: e.target.value.replace(/\D/g, '')})} 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-800 outline-none bg-gray-50 font-mono tracking-wider" 
              placeholder="XXXXXXXX" 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">رقم العائلة</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={formData.familyIdNumber} 
                onChange={(e) => setFormData({...formData, familyIdNumber: e.target.value.replace(/\D/g, '')})} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-800 outline-none bg-gray-50 font-mono" 
                placeholder="XXXXX" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">المواليد</label>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={4}
                value={formData.birthYear} 
                onChange={(e) => setFormData({...formData, birthYear: e.target.value.replace(/\D/g, '').slice(0,4)})} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-800 outline-none bg-gray-50 font-mono" 
                placeholder="YYYY" 
              />
            </div>
          </div>
          
        </div>
        
        {/* AI Shammari Poet Bot Section (Replaces Notes) */}
        <div className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-white rounded-xl p-4 shadow-sm relative overflow-hidden group">
           <div className="absolute -right-6 -top-6 w-20 h-20 bg-yellow-100 rounded-full blur-xl group-hover:bg-yellow-200 transition"></div>
           
           <div className="relative z-10 text-center space-y-3">
             {!poetText ? (
                <div className="flex flex-col items-center gap-2">
                   <div className="bg-red-800/10 p-3 rounded-full">
                      <Feather className="w-6 h-6 text-red-800" />
                   </div>
                   <p className="text-sm font-bold text-gray-800">شاعر القبيلة (الذكاء الاصطناعي)</p>
                   <p className="text-xs text-gray-500">هل تحتاج لومضة شعرية حماسية؟</p>
                </div>
             ) : (
                <div className="animate-fade-in-up">
                   <Sparkles className="w-4 h-4 text-yellow-500 absolute top-0 right-0 animate-pulse" />
                   <p className="text-lg font-bold text-red-900 leading-relaxed font-cairo italic px-4">
                      "{poetText}"
                   </p>
                </div>
             )}
             
             <button
               type="button"
               onClick={handleGeneratePoem}
               disabled={isPoetLoading}
               className="text-xs bg-red-800 text-white px-4 py-2 rounded-full hover:bg-red-900 transition active:scale-95 flex items-center gap-2 mx-auto"
             >
               {isPoetLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
               {poetText ? "بيت شعر آخر" : "استدعاء شاعر شمر"}
             </button>
           </div>
        </div>

        <button
          type="submit"
          disabled={isValidating || googleSheetStatus === 'sending'}
          className="w-full bg-gradient-to-r from-red-800 to-red-600 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {googleSheetStatus === 'sending' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          {googleSheetStatus === 'sending' ? 'جاري الحفظ والإرسال...' : 'حفظ وإرسال'}
        </button>
        
        <p className="text-center text-xs text-gray-400 mt-2">
            يتم حفظ البيانات بشكل مشفر وآمن وفقاً لضوابط الخصوصية.
        </p>
      </form>
    </div>
  );
};

export default RegistrationForm;