
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import SecurityVerification from './components/SecurityVerification';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import CandidatesList from './components/CandidatesList';
import ChatBot from './components/ChatBot';
import { District, Voter } from './types';
import { PlusCircle, LayoutDashboard, Award, LogOut, ShieldCheck, UserCheck, Smartphone } from 'lucide-react';

type AppFlow = 'LOGIN' | 'VERIFY_CARD' | 'AUTHORIZED_APP';

const App: React.FC = () => {
  const [flow, setFlow] = useState<AppFlow>('LOGIN');
  const [activeTab, setActiveTab] = useState<'register' | 'stats' | 'vote'>('register');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [canVoteSession, setCanVoteSession] = useState(false);

  // Persistence logic
  useEffect(() => {
    const savedFlow = localStorage.getItem('shammari_flow_state');
    if (savedFlow === 'AUTHORIZED_APP') {
      setFlow('AUTHORIZED_APP');
    } else if (savedFlow === 'VERIFY_CARD') {
      setFlow('VERIFY_CARD');
    }
  }, []);

  const handleLoginSuccess = () => {
    setFlow('VERIFY_CARD');
    localStorage.setItem('shammari_flow_state', 'VERIFY_CARD');
  };

  const handleVerificationSuccess = () => {
    setFlow('AUTHORIZED_APP');
    localStorage.setItem('shammari_flow_state', 'AUTHORIZED_APP');
  };

  const handleLogout = () => {
    setFlow('LOGIN');
    localStorage.removeItem('shammari_flow_state');
    localStorage.removeItem('shammari_auth_token');
    setCanVoteSession(false);
  };

  const handleAddVoter = (voter: Voter) => {
    setVoters(prev => [voter, ...prev]);
  };

  const handleRegistrationSuccess = () => {
    setCanVoteSession(true);
  };

  // Rendering logic based on flow
  if (flow === 'LOGIN') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (flow === 'VERIFY_CARD') {
    return <SecurityVerification onVerified={handleVerificationSuccess} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-cairo pb-24 relative">
      {/* Header Profile Section */}
      <header className="bg-shammari-red text-white p-4 shadow-lg flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner">
            <UserCheck className="w-6 h-6 text-shammari-red" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-none">شمر تنتخب</h1>
            <p className="text-[10px] text-red-100 opacity-80">صلاح الدين - دخول مخول</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {activeTab === 'register' && (
          <div className="animate-fade-in-up">
            <RegistrationForm 
              onAddVoter={handleAddVoter} 
              onRegistrationSuccess={handleRegistrationSuccess}
            />
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="animate-fade-in-up">
            <Dashboard voters={voters} onViewImage={setViewingImage} canVote={canVoteSession} />
          </div>
        )}

        {activeTab === 'vote' && (
          <div className="animate-fade-in-up">
            <CandidatesList canVote={canVoteSession} isAdmin={false} />
          </div>
        )}
      </main>

      {/* Floating Chatbot */}
      <ChatBot voters={voters} />

      {/* Bottom Navigation - 3 Phases */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 flex items-center justify-around px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
        <button 
          onClick={() => setActiveTab('register')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'register' ? 'text-shammari-red scale-110' : 'text-gray-400'}`}
        >
          <PlusCircle className={`w-6 h-6 ${activeTab === 'register' ? 'fill-shammari-red/10' : ''}`} />
          <span className="text-[10px] font-black">المرحلة ١: التسجيل</span>
        </button>

        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-shammari-red scale-110' : 'text-gray-400'}`}
        >
          <LayoutDashboard className={`w-6 h-6 ${activeTab === 'stats' ? 'fill-shammari-red/10' : ''}`} />
          <span className="text-[10px] font-black">المرحلة ٢: الإحصائيات</span>
        </button>

        <button 
          onClick={() => setActiveTab('vote')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'vote' ? 'text-shammari-red scale-110' : 'text-gray-400'}`}
        >
          <Award className={`w-6 h-6 ${activeTab === 'vote' ? 'fill-shammari-red/10' : ''}`} />
          <span className="text-[10px] font-black">المرحلة ٣: الانتخابات</span>
        </button>
      </nav>

      {/* Modal for viewing images */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <img src={viewingImage} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="Preview" />
        </div>
      )}
    </div>
  );
};

export default App;
