
import React, { useMemo } from 'react';
import { Voter } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, MapPin, Activity, Unlock, Lock } from 'lucide-react';
import CandidatesList from './CandidatesList';

interface DashboardProps {
  voters: Voter[];
  onViewImage: (imageUrl: string) => void;
  canVote: boolean;
}

const ADMIN_EMAIL = 'cptstaf2017@gmail.com';

const Dashboard: React.FC<DashboardProps> = ({ voters, onViewImage, canVote }) => {
  
  const currentUserEmail = localStorage.getItem('shammari_user_email');
  const isAdmin = currentUserEmail === ADMIN_EMAIL;

  const stats = useMemo(() => {
    // District Stats
    const districtCounts: Record<string, number> = {};
    voters.forEach(v => {
      districtCounts[v.district] = (districtCounts[v.district] || 0) + 1;
    });

    const districtData = Object.entries(districtCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Clan Stats
    const clanCounts: Record<string, number> = {};
    voters.forEach(v => {
      const clan = v.subClan || 'غير محدد';
      clanCounts[clan] = (clanCounts[clan] || 0) + 1;
    });

    const clanData = Object.entries(clanCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { districtData, clanData };
  }, [voters]);

  const performExport = () => {
    // --- SECURITY CHECK ---
    // Only the specific admin email can download the Excel file.
    if (!isAdmin) {
        alert(`عذراً، هذا الملف مقفل.\n\nصلاحية التصدير محصورة بالمسؤول الرئيسي فقط:\n(${ADMIN_EMAIL})`);
        return;
    }

    if (!voters || voters.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    // إنشاء محتوى الجدول كـ HTML ليفتح في Excel بشكل منسق
    const tableRows = voters.map(v => {
      const frontCellContent = v.frontImageUrl 
        ? `<a href="${v.frontImageUrl}" target="_blank" style="color:#1d4ed8; font-weight:bold; text-decoration:underline;">عرض الصورة (Drive)</a>`
        : (v.voterCardImage ? `<img src="${v.voterCardImage}" width="100" height="60" style="display:block; margin:auto; max-height:60px; width:auto;" />` : '<span style="color:#9ca3af;">لا يوجد</span>');

      const backCellContent = v.backImageUrl
        ? `<a href="${v.backImageUrl}" target="_blank" style="color:#1d4ed8; font-weight:bold; text-decoration:underline;">عرض الظهر (Drive)</a>`
        : (v.voterCardBackImage ? `<img src="${v.voterCardBackImage}" width="100" height="60" style="display:block; margin:auto; max-height:60px; width:auto;" />` : '<span style="color:#9ca3af;">لا يوجد</span>');

      const gpsLinkContent = (v.gpsLat && v.gpsLng) 
        ? `<a href="https://www.google.com/maps?q=${v.gpsLat},${v.gpsLng}" target="_blank" style="color:#10b981; font-weight:bold; text-decoration:underline;">عرض الموقع (GPS)</a>`
        : '<span style="color:#9ca3af;">غير متوفر</span>';

      return `
      <tr>
        <td>${v.id}</td>
        <td>${v.fullName}</td>
        <td style='mso-number-format:"\\@"'>${v.phone}</td>
        <td>${v.district}</td>
        <td>${v.subClan}</td>
        <td style='mso-number-format:"\\@"'>${v.voterIdNumber || ''}</td>
        <td style='mso-number-format:"\\@"'>${v.familyIdNumber || ''}</td>
        <td>${v.birthYear || ''}</td>
        <td>${new Date(v.registeredAt).toLocaleDateString('ar-IQ')}</td>
        <td style="text-align:center; vertical-align:middle;">${frontCellContent}</td>
        <td style="text-align:center; vertical-align:middle;">${backCellContent}</td>
        <td style="text-align:center; vertical-align:middle;">${gpsLinkContent}</td>
        <td>${v.notes || ''}</td>
      </tr>
    `}).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>سجل الناخبين</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Cairo', sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 8px; text-align: right; vertical-align: middle; }
          th { background-color: #8B0000; color: #ffffff; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          a { text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>المعرف (ID)</th>
              <th>الاسم الثلاثي</th>
              <th>رقم الهاتف</th>
              <th>المنطقة</th>
              <th>العشيرة / الفخذ</th>
              <th>رقم الناخب</th>
              <th>رقم العائلة</th>
              <th>المواليد</th>
              <th>تاريخ التسجيل</th>
              <th>رابط صورة الوجه</th>
              <th>رابط صورة الظهر</th>
              <th>موقع التصويت (GPS)</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shammari_Voters_List_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const CLAN_COLORS = ['#8B0000', '#F59E0B', '#1F2937', '#4B5563', '#9CA3AF', '#B91C1C', '#D97706'];

  return (
    <div className="space-y-6 md:space-y-8 relative">
      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={performExport}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl shadow-md transition-all font-bold text-sm sm:text-base group ${
            isAdmin 
              ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform active:scale-[0.98] sm:hover:-translate-y-0.5" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-300"
          }`}
        >
          {isAdmin ? (
            <>
               <Unlock className="w-5 h-5" />
               تصدير السجل (ملف Excel)
            </>
          ) : (
            <>
               <Lock className="w-5 h-5 text-red-500" />
               <span>الملف مقفل (للمسؤول فقط)</span>
            </>
          )}
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-md border-r-4 border-red-800 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">إجمالي المسجلين</p>
            <p className="text-3xl font-bold text-gray-900">{voters.length}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-red-800" />
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl shadow-md border-r-4 border-yellow-500 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">أعلى منطقة</p>
            <p className="text-2xl font-bold text-gray-900 truncate max-w-[140px]">
              {stats.districtData[0]?.name || '---'}
            </p>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shadow-sm">
            <MapPin className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl shadow-md border-r-4 border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">التغطية</p>
            <p className="text-3xl font-bold text-gray-900">{stats.districtData.length} <span className="text-lg text-gray-500">أقضية</span></p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6 text-gray-800" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Bar Chart - Districts (Burgundy on White) */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-800" />
            توزيع الناخبين حسب المناطق
          </h3>
          <div className="h-[280px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.districtData} layout="vertical" margin={{ right: 20, left: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                {/* Integers only, Dark Text */}
                <XAxis type="number" tick={{fontSize: 12, fill: '#374151'}} allowDecimals={false} axisLine={{stroke: '#e5e7eb'}} tickLine={{stroke: '#e5e7eb'}} />
                <YAxis dataKey="name" type="category" width={75} tick={{fontSize: 11, fill: '#1f2937', fontWeight: 600}} axisLine={{stroke: '#e5e7eb'}} tickLine={{stroke: '#e5e7eb'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#1f2937', direction: 'rtl', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[0, 4, 4, 0]} 
                  barSize={24} 
                  fill="#8B0000" // Deep Red (Burgundy)
                  activeBar={{ fill: '#b91c1c' }} // Slightly brighter red on hover
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Clans (Replaced Shammari Art) */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-600" />
            توزيع الناخبين حسب العشائر
          </h3>
          <div className="h-[280px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.clanData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.clanData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CLAN_COLORS[index % CLAN_COLORS.length]} strokeWidth={1} stroke="#fff" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', direction: 'rtl' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Candidates Voting Section */}
      <CandidatesList canVote={canVote} isAdmin={isAdmin} />

      {/* NOTE: The Voter Registry Table has been moved to HiddenVoterRegistry.tsx and is hidden from view. */}
    </div>
  );
};

export default Dashboard;
