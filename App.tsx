
import React, { useState, useEffect } from 'react';
import { ShammariLogo } from './components/Icons';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import ChatBot from './components/ChatBot';
import { District, Voter } from './types';
import { analyzeVoterDemographics } from './services/geminiService';
import { LayoutDashboard, PlusCircle, Sparkles, Database, Eye, X, Home, BarChart2, LogOut, QrCode, Smartphone, Share2 } from 'lucide-react';

// Mock data to start with - Updated with new Districts and Source
const MOCK_DATA: Voter[] = [
  { id: '1', fullName: 'سعد الشمري', phone: '07701234567', district: District.Tikrit, subClan: 'الأسلم', registeredAt: '2023-10-01', source: 'admin_entry' },
  { id: '2', fullName: 'فيصل عبد الكريم', phone: '07707654321', district: District.Samarra, subClan: 'عبدة', registeredAt: '2023-10-02', source: 'mobile_app' },
  { id: '3', fullName: 'عمر طه', phone: '07800000000', district: District.AlShirqat, subClan: 'سنجارة', registeredAt: '2023-10-03', source: 'web' },
  { id: '4', fullName: 'خالد وليد', phone: '07500000000', district: District.AlDhuluiya, subClan: 'الأسلم', registeredAt: '2023-10-04', source: 'admin_entry' },
  { id: '5', fullName: 'ياسر عمار', phone: '07900000000', district: District.AlDour, subClan: 'الأسلم', registeredAt: '2023-10-05', source: 'mobile_app' },
  { id: '6', fullName: 'حسين علي', phone: '07700000000', district: District.AlAlam, subClan: 'عبدة', registeredAt: '2023-10-06', source: 'web' },
  { id: '7', fullName: 'محمود الصايح', phone: '07700000000', district: District.Tikrit, subClan: 'الصايح', registeredAt: '2023-10-07', source: 'mobile_app' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'dashboard'>('register');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Strict Voting State: Locked by default, unlocks ONLY after adding a valid card
  const [canVote, setCanVote] = useState(false);

  // Initialize
  useEffect(() => {
    // Check for existing session token to keep user logged in
    const token = localStorage.getItem('shammari_auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
    
    setVoters(MOCK_DATA);
    
    // Onboarding logic is now tied to authentication status
    const hasSeenOnboarding = localStorage.getItem('shammari_onboarding_seen');
    if (!hasSeenOnboarding && token) { // Show onboarding only if logged in and hasn't seen it
      setShowOnboarding(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('shammari_auth_token', 'true'); // Create session token
    setIsAuthenticated(true);

    // After a successful login, check if the user needs to see the onboarding.
    const hasSeenOnboarding = localStorage.getItem('shammari_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('shammari_auth_token'); // Clear session token
    setIsAuthenticated(false);
    setCanVote(false); // Reset voting permission on logout
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem('shammari_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const handleAddVoter = (voter: Voter) => {
    setVoters(prev => [voter, ...prev]);
    // Unlock voting ONLY when a voter is successfully added (which implies Salah al-Din validation passed)
    setCanVote(true);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeVoterDemographics(voters);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // If user is not authenticated, render the Login component exclusively.
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // If authenticated, render the main application.
  return (
    <div className="min-h-screen bg-gray-100 font-cairo pb-24 md:pb-20 relative overflow-x-hidden">
      {/* Onboarding Overlay */}
      {showOnboarding && <Onboarding onComplete={handleFinishOnboarding} />}

      {/* Image Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setViewingImage(null)}>
          <div className="relative bg-white rounded-lg p-1 max-w-lg w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingImage(null)}
              className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={viewingImage} alt="Voter Card Evidence" className="w-full h-auto rounded max-h-[80vh] object-contain" />
            <div className="bg-white p-3 text-center rounded-b-lg">
                <p className="font-bold text-gray-800">صورة بطاقة الناخب</p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Authenticated Users */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-red-800" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">شارك التطبيق</h3>
            <p className="text-sm text-gray-500 mb-6">اسمح للآخرين بمسح الرمز أدناه لتثبيت التطبيق.</p>
            
            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-inner inline-block mb-4">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff`} 
                 alt="App QR Code" 
                 className="w-48 h-48 object-contain"
               />
            </div>
          </div>
        </div>
      )}

      {/* Header / Hero Section */}
      <div className="relative bg-gradient-to-b from-red-900 to-red-800 pb-12 pt-8 md:pb-28 px-4 md:px-6 shadow-2xl">
        
        {/* Top Right Actions */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 text-red-200 hover:text-white bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold transition-all hover:bg-white/20 active:scale-95"
            title="مشاركة التطبيق"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-200 hover:text-white bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold transition-all hover:bg-white/20 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="w-14 h-14 md:w-20 md:h-20 bg-red-800 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-lg shrink-0">
                <ShammariLogo className="w-9 h-9 md:w-14 md:h-14 drop-shadow-md" />
             </div>
             <div className="flex-1">
               <h1 className="text-2xl md:text-4xl font-black text-white tracking-wide leading-tight">
                 شمر <span className="text-yellow-400">تنتخب</span>
               </h1>
               <p className="text-red-200 mt-1 text-xs md:text-base font-bold">
                 الانتخابات التمهيدية لقبيلة شمر في صلاح الدين
               </p>
             </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 no-scrollbar">
            <div className="flex-1 md:flex-none min-w-[100px] bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10 text-center">
              <p className="text-red-200 text-[10px] md:text-xs mb-1">العدد الكلي</p>
              <p className="text-xl md:text-2xl font-bold text-white">{voters.length}</p>
            </div>
            <div className="flex-1 md:flex-none min-w-[100px] bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10 text-center">
              <p className="text-red-200 text-[10px] md:text-xs mb-1">القضاء الأكبر</p>
              <p className="text-lg md:text-xl font-bold text-yellow-400 truncate max-w-[100px] md:max-w-none mx-auto">تكريت</p>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
           <ShammariLogo className="absolute -left-10 top-10 w-72 h-72 md:w-96 md:h-96 rotate-12" />
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-3 md:px-6 mt-4 md:-mt-16 relative z-10">
        
        {/* Desktop Navigation Tabs (Hidden on Mobile) */}
        <div className="hidden md:flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl font-bold transition-all shadow-md whitespace-nowrap ${
              activeTab === 'register' 
                ? 'bg-white text-red-800 border-2 border-red-800 translate-y-0' 
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-800 backdrop-blur-md border-2 border-transparent'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            تسجيل ناخب
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl font-bold transition-all shadow-md whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'bg-white text-red-800 border-2 border-red-800 translate-y-0' 
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-800 backdrop-blur-md border-2 border-transparent'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            الإحصائيات
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6 md:space-y-8 pb-safe">
          {activeTab === 'register' ? (
            <div className="animate-fade-in-up space-y-6">
              <RegistrationForm onAddVoter={handleAddVoter} />
              {/* Removed Last Registered List as requested */}
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-6 md:space-y-8 mb-8">
              <Dashboard voters={voters} onViewImage={setViewingImage} canVote={canVote} />
              
              {/* AI Analysis Section */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                  <Sparkles className="w-32 h-32 text-yellow-400" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    المستشار الذكي
                  </h3>
                  <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed max-w-2xl">
                    اضغط للتحليل باستخدام الذكاء الاصطناعي للحصول على رؤى حول توزيع الناخبين ورسائل مقترحة للحملة.
                  </p>
                  
                  {!aiAnalysis && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full md:w-auto bg-white text-gray-900 hover:bg-yellow-400 font-bold py-3 px-8 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? 'جاري التحليل...' : 'تحليل البيانات الآن'}
                      {isAnalyzing && <div className="animate-spin h-4 w-4 border-2 border-gray-900 rounded-full border-t-transparent"></div>}
                    </button>
                  )}

                  {aiAnalysis && (
                    <div className="mt-6 bg-white/10 backdrop-blur-md rounded-lg p-4 md:p-6 border border-white/20 animate-fade-in-up">
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                        <div dangerouslySetInnerHTML={{ 
                          __html: aiAnalysis
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-400">$1</strong>')
                            .replace(/\n/g, '<br />')
                         }} />
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                        <button 
                          onClick={() => setAiAnalysis(null)}
                          className="text-sm text-gray-400 hover:text-white underline"
                        >
                          إعادة التحليل
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Chat Bot */}
      <ChatBot voters={voters} />

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-16">
          <button 
            onClick={() => setActiveTab('register')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'register' ? 'text-red-800' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`p-1 rounded-full transition-all ${activeTab === 'register' ? 'bg-red-50' : ''}`}>
              <Home className={`w-6 h-6 ${activeTab === 'register' ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'dashboard' ? 'text-red-800' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`p-1 rounded-full transition-all ${activeTab === 'dashboard' ? 'bg-red-50' : ''}`}>
              <BarChart2 className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold">الإحصائيات</span>
          </button>
        </div>
      </div>

      {/* Footer (Visible on Desktop, hidden/adjusted on mobile) */}
      <footer className="hidden md:block bg-gray-900 text-gray-400 py-8 mt-12 text-center px-4">
        <div className="max-w-xs mx-auto h-0.5 bg-gray-800 mb-6"></div>
        <p className="text-sm font-medium text-gray-300">© {new Date().getFullYear()} شمر تنتخب - قاعدة بيانات صلاح الدين</p>
        <p className="text-xs mt-2 text-gray-600">نظام آمن لإدارة الناخبين</p>
      </footer>
    </div>
  );
};

export default App;
