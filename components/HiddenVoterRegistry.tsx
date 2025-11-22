import React, { useMemo, useState } from 'react';
import { Voter } from '../types';
import { Search, FileSpreadsheet, Eye, FileText } from 'lucide-react';

// This component is deliberately hidden from the main UI as per user request.
// It contains the logic for displaying the full voter list table.

interface HiddenVoterRegistryProps {
  voters: Voter[];
  onViewImage: (imageUrl: string) => void;
}

const HiddenVoterRegistry: React.FC<HiddenVoterRegistryProps> = ({ voters, onViewImage }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVoters = useMemo(() => {
    return voters.filter(v => 
      v.fullName.includes(searchTerm) || 
      v.phone.includes(searchTerm) ||
      v.district.includes(searchTerm) ||
      v.subClan.includes(searchTerm) ||
      (v.voterIdNumber && v.voterIdNumber.includes(searchTerm))
    );
  }, [voters, searchTerm]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-gray-800 mt-8">
      <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-gray-600" />
          سجل بيانات الناخبين
        </h3>
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث (الاسم، الهاتف، المنطقة، رقم الناخب...)"
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-800 focus:border-transparent outline-none text-sm transition"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto touch-pan-x scrollbar-thin scrollbar-thumb-gray-300 pb-2">
        <table className="w-full text-sm text-right whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">المعرف</th>
              <th className="px-6 py-4">الاسم الكامل</th>
              <th className="px-6 py-4">رقم الناخب</th>
              <th className="px-6 py-4">رقم العائلة</th>
              <th className="px-6 py-4">المنطقة</th>
              <th className="px-6 py-4">الهاتف</th>
              <th className="px-6 py-4">البطاقة</th>
              <th className="px-6 py-4">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredVoters.length > 0 ? (
              filteredVoters.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{v.id.slice(-6)}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{v.fullName}</td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                      {v.voterIdNumber ? (
                        <span className="bg-gray-100 border border-gray-300 px-2 py-1 rounded text-xs font-bold">
                          {v.voterIdNumber}
                        </span>
                      ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                      {v.familyIdNumber || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-bold border border-gray-200">
                      {v.district}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600" dir="ltr">{v.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {v.voterCardImage ? (
                        <button 
                          onClick={() => onViewImage(v.voterCardImage!)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition font-medium text-xs"
                          title="وجه البطاقة"
                        >
                          <Eye className="w-3 h-3" /> وجه
                        </button>
                      ) : null}
                      {v.voterCardBackImage ? (
                          <button 
                          onClick={() => onViewImage(v.voterCardBackImage!)}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition font-medium text-xs"
                          title="ظهر البطاقة"
                        >
                          <FileText className="w-3 h-3" /> ظهر
                        </button>
                      ) : null}
                      {!v.voterCardImage && !v.voterCardBackImage && <span className="text-gray-300 text-xs italic">لا توجد</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{new Date(v.registeredAt).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  لا توجد نتائج مطابقة للبحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
          <span>عرض {filteredVoters.length} من أصل {voters.length} ناخب</span>
      </div>
    </div>
  );
};

export default HiddenVoterRegistry;