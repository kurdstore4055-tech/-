
import React, { useState, useEffect } from 'react';
import { ShammariLogo } from './Icons';
import { ScanFace, ShieldCheck, BarChart3, ArrowLeft, Check, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
  }, []);

  const steps = [
    {
      title: "مرحباً بك في شمر تنتخب",
      description: "المنصة الرقمية الأولى لإدارة العملية الانتخابية لقبيلة شمر في صلاح الدين، بتصميم عصري وتقنيات ذكية.",
      icon: <div className="w-32 h-32 animate-scale-in"><ShammariLogo className="w-full h-full drop-shadow-2xl" /></div>,
      color: "from-red-900 to-red-800"
    },
    {
      title: "مسح ضوئي ذكي",
      description: "لا داعي للكتابة اليدوية. استخدم الكاميرا لاستخراج بيانات الناخبين من البطاقة الوطنية وبطاقة الناخب بدقة عالية.",
      icon: <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md animate-bounce"><ScanFace className="w-12 h-12 text-yellow-400" /></div>,
      color: "from-slate-900 to-slate-800"
    },
    {
      title: "أمان وخصوصية تامة",
      description: "بيانات العشيرة أمانة. يتم تشفير البيانات وتخزينها بشكل آمن، مع صلاحيات وصول محددة للمسؤولين فقط.",
      icon: <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md"><ShieldCheck className="w-12 h-12 text-green-400" /></div>,
      color: "from-green-900 to-green-800"
    },
    {
      title: "إحصائيات وتحليلات",
      description: "لوحة تحكم متكاملة تعرض توزيع الناخبين حسب المناطق والأفخاذ، مما يساعد في رسم الاستراتيجية الانتخابية.",
      icon: <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md"><BarChart3 className="w-12 h-12 text-blue-400" /></div>,
      color: "from-blue-900 to-blue-800"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300); // Wait for exit animation
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background Backdrop */}
      <div className="absolute inset-0 bg-red-950/90 backdrop-blur-sm" />

      {/* Main Card */}
      <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-10 scale-95'} mx-4`}>
        
        {/* Top Visual Section */}
        <div className={`relative h-[320px] bg-gradient-to-br ${steps[step].color} flex flex-col items-center justify-center transition-colors duration-700`}>
           
           {/* Pattern Overlay */}
           <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
           
           {/* Icon/Image Container */}
           <div className="relative z-10 transform transition-all duration-500 ease-out" key={step}>
             {steps[step].icon}
           </div>

           {/* Skip Button */}
           <button 
             onClick={handleClose}
             className="absolute top-4 right-4 text-white/60 hover:text-white text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10 transition"
           >
             تخطي
           </button>
        </div>

        {/* Bottom Content Section */}
        <div className="p-8 flex flex-col h-[240px]">
          <div className="flex-1 text-center space-y-4">
             <h2 className="text-2xl font-black text-gray-800 animate-fade-in-up key={step}">{steps[step].title}</h2>
             <p className="text-gray-500 leading-relaxed text-sm animate-fade-in-up delay-100">{steps[step].description}</p>
          </div>

          {/* Footer / Controls */}
          <div className="flex items-center justify-between mt-6">
            {/* Page Indicators */}
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-red-800' : 'w-2 bg-gray-200'}`} 
                />
              ))}
            </div>

            {/* Action Button */}
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg group"
            >
              {step === steps.length - 1 ? (
                <>
                  ابدأ الآن <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  التالي <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
