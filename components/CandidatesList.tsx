
import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { Vote, CheckCircle, Award, Trophy, TrendingUp, AlertCircle, Search, Lock, CloudUpload } from 'lucide-react';
import { sendVoteToGoogleSheets } from '../services/geminiService';

// Expanded list of 30 Candidates - Strictly Shammari Tribe
const INITIAL_CANDIDATES: Candidate[] = [
  { id: '1', name: 'الشيخ صباح الشمري', title: 'شيخ عام', votes: 1240 },
  { id: '2', name: 'الدكتور أحمد الأسلمي', title: 'أكاديمي', votes: 980 },
  { id: '3', name: 'المهندس عمر السنجاري', title: 'تكنوقراط', votes: 850 },
  { id: '4', name: 'الأستاذ خالد العبدي', title: 'ناشط مدني', votes: 620 },
  { id: '5', name: 'الحاج محمود الصايحي', title: 'وجيه عشائر', votes: 410 },
  { id: '6', name: 'اللواء الركن فهد الجربا', title: 'قائد عسكري متقاعد', votes: 390 },
  { id: '7', name: 'الشيخ ميزر الجربا', title: 'زعيم قبلي', votes: 300 },
  { id: '8', name: 'الدكتور ياسين الثابتي', title: 'طبيب استشاري', votes: 350 },
  { id: '9', name: 'المحامي طارق الفداغي', title: 'خبير قانوني', votes: 320 },
  { id: '10', name: 'المهندس عادل التومي', title: 'مدير مشاريع', votes: 280 },
  { id: '11', name: 'الأستاذ جمال الزميلي', title: 'مربي فاضل', votes: 260 },
  { id: '12', name: 'السيد راكان الصديد', title: 'شخصية اجتماعية', votes: 240 },
  { id: '13', name: 'الدكتور صفاء العمودي', title: 'باحث سياسي', votes: 220 },
  { id: '14', name: 'الشيخ برهان الغافلي', title: 'شيخ عشيرة', votes: 200 },
  { id: '15', name: 'العميد سعدون الوجعان', title: 'ضابط شرطة', votes: 190 },
  { id: '16', name: 'الأستاذ حميد المسعودي', title: 'ناشط حقوقي', votes: 180 },
  { id: '17', name: 'المهندس كمال الحساني', title: 'خبير زراعي', votes: 170 },
  { id: '18', name: 'الحاج سالم الدغيري', title: 'تاجر', votes: 160 },
  { id: '19', name: 'السيد نوري الشمري', title: 'إعلامي', votes: 150 },
  { id: '20', name: 'الدكتور فؤاد الأسلمي', title: 'أستاذ جامعي', votes: 140 },
  { id: '21', name: 'الشيخ غازي العلي', title: 'وجيه', votes: 130 },
  { id: '22', name: 'المحامي وليد الجحيشي', title: 'مستشار', votes: 120 },
  { id: '23', name: 'الأستاذ قصي البري', title: 'مدير مدرسة', votes: 110 },
  { id: '24', name: 'المهندس حسام النبهان', title: 'رجل أعمال', votes: 100 },
  { id: '25', name: 'السيد زياد الربع', title: 'موظف', votes: 90 },
  { id: '26', name: 'الحاج كريم السويدي', title: 'وجيه منطقة', votes: 80 },
  { id: '27', name: 'الدكتور ماجد الفايد', title: 'طبيب', votes: 70 },
  { id: '28', name: 'العميد فوزي الشمري', title: 'متقاعد', votes: 60 },
  { id: '29', name: 'الأستاذ بشار العفاريت', title: 'تربوي', votes: 50 },
  { id: '30', name: 'الشيخ رعد الرمال', title: 'شخصية عامة', votes: 40 },
];

interface CandidatesListProps {
  canVote: boolean;
  isAdmin: boolean;
}

const CandidatesList: React.FC<CandidatesListProps> = ({ canVote, isAdmin }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedForId, setVotedForId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Load data from local storage to simulate persistence
    const savedData = localStorage.getItem('shammari_candidates_data');
    const savedVoteStatus = localStorage.getItem('shammari_has_voted');
    const savedVotedId = localStorage.getItem('shammari_voted_for_id');

    if (savedData) {
      setCandidates(JSON.parse(savedData));
    } else {
      setCandidates(INITIAL_CANDIDATES);
    }

    if (savedVoteStatus === 'true') {
      setHasVoted(true);
      setVotedForId(savedVotedId);
    }
  }, []);

  const handleVote = async (candidateId: string) => {
    if (hasVoted || !canVote) return;

    // 1. Update Local State (Optimistic UI)
    const updatedCandidates = candidates.map(c => {
      if (c.id === candidateId) {
        return { ...c, votes: c.votes + 1 };
      }
      return c;
    });

    const selectedCandidate = updatedCandidates.find(c => c.id === candidateId);
    
    setCandidates(updatedCandidates);
    setHasVoted(true);
    setVotedForId(candidateId);

    // Save to storage
    localStorage.setItem('shammari_candidates_data', JSON.stringify(updatedCandidates));
    localStorage.setItem('shammari_has_voted', 'true');
    localStorage.setItem('shammari_voted_for_id', candidateId);

    // 2. Send to Google Sheets (Cloud Backup)
    if (selectedCandidate) {
        // Fire and forget
        sendVoteToGoogleSheets(selectedCandidate);
    }
  };

  // Filter and Sort for Display
  const displayedCandidates = candidates
    .filter(c => c.name.includes(searchTerm))
    .sort((a, b) => b.votes - a.votes);

  const maxVotes = displayedCandidates.length > 0 ? displayedCandidates[0].votes : 1;

  // VISIBILITY LOGIC:
  // Strictly limit results to ADMIN ONLY to prevent influencing the voting process.
  // Regular users (even after voting) will NOT see the numbers.
  const showResults = isAdmin;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-yellow-500 mt-8 flex flex-col max-h-[800px]">
      
      {/* Locked Warning Banner */}
      {!canVote && (
        <div className="bg-red-50 border-b border-red-200 p-4 flex items-center justify-center text-red-800 gap-2 animate-pulse">
          <Lock className="w-5 h-5" />
          <span className="font-bold text-sm">نظام التصويت مقفل. يجب تسجيل بطاقة ناخب (صلاح الدين) أولاً لفتح التصويت.</span>
        </div>
      )}

      <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white shrink-0">
        <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-600" />
            قائمة المرشحين ({candidates.length})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
             الانتخابات التمهيدية - يحق لك التصويت لمرشح واحد فقط.
            </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 md:w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="بحث عن مرشح..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-full py-1.5 pr-9 pl-3 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                />
            </div>

            {hasVoted && (
                <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200 shadow-sm whitespace-nowrap">
                    <CheckCircle className="w-3 h-3" />
                    تم التصويت
                    <CloudUpload className="w-3 h-3 text-green-600 opacity-60" />
                </div>
            )}
            {!hasVoted && (
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border whitespace-nowrap ${canVote ? 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    {canVote ? <AlertCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {canVote ? 'التصويت مفتوح' : 'التصويت مقفل'}
                </div>
            )}
        </div>
      </div>

      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        <table className="w-full text-right border-collapse">
          <thead className="bg-gray-900 text-gray-200 text-sm sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-6 py-3 text-right">اسم المرشح</th>
              {/* Conditional Results Column (Admin Only) */}
              {showResults && <th className="px-4 py-3 text-center w-1/3">نتائج التصويت</th>}
              <th className="px-4 py-3 w-32 text-center">اجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedCandidates.map((candidate, index) => {
              const isWinner = index === 0;
              const isMyChoice = votedForId === candidate.id;
              const progressPercent = (candidate.votes / maxVotes) * 100;

              return (
                <tr key={candidate.id} className={`transition hover:bg-gray-50 ${isMyChoice ? 'bg-green-50/60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       {/* Rank Number */}
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm shrink-0 ${isWinner && showResults ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                           {isWinner && showResults ? <Trophy className="w-4 h-4" /> : (index + 1)}
                       </div>
                       
                       <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                                {candidate.name}
                                {isMyChoice && <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full">اختيارك</span>}
                            </span>
                            <span className="text-xs text-gray-500">{candidate.title}</span>
                       </div>
                    </div>
                  </td>
                  
                  {/* Voting Results Column - Contains Count and Progress Bar (Admin Only) */}
                  {showResults && (
                    <td className="px-4 py-3">
                       <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center px-1">
                             <span className="font-mono font-bold text-gray-900">{candidate.votes} صوت</span>
                             {isWinner && <TrendingUp className="w-4 h-4 text-green-500" />}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                  className={`h-2 rounded-full transition-all duration-1000 ${isWinner ? 'bg-yellow-500' : 'bg-gray-500'}`} 
                                  style={{ width: `${progressPercent}%` }}
                              ></div>
                          </div>
                       </div>
                    </td>
                  )}

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleVote(candidate.id)}
                      disabled={hasVoted || !canVote}
                      className={`
                        flex items-center justify-center gap-1 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm w-full
                        ${!canVote 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : hasVoted 
                                ? (isMyChoice 
                                    ? 'bg-green-600 text-white cursor-default ring-2 ring-green-200' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : 'bg-red-800 hover:bg-red-900 text-white hover:shadow-md active:scale-95'
                        }
                      `}
                      title={!canVote ? "يجب تسجيل بطاقة ناخب أولاً" : ""}
                    >
                      {!canVote ? (
                        <>
                           <Lock className="w-3 h-3" /> مقفل
                        </>
                      ) : hasVoted ? (
                        isMyChoice ? (
                            <>
                                <CheckCircle className="w-3 h-3" /> تم
                            </>
                        ) : (
                            'مغلق'
                        )
                      ) : (
                        <>
                            <Vote className="w-3 h-3" /> تصويت
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {displayedCandidates.length === 0 && (
                <tr>
                    <td colSpan={showResults ? 3 : 2} className="text-center py-8 text-gray-500 text-sm">
                        لا يوجد مرشح بهذا الاسم.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 p-2 text-center text-[10px] text-gray-400 border-t border-gray-200">
        عرض {displayedCandidates.length} مرشح
      </div>
    </div>
  );
};

export default CandidatesList;
