import React from "react";
import { 
  Users, BarChart3, FileText, Lock, LayoutDashboard, 
  UploadCloud, AlertCircle, IdCard, Bell, Globe2, WifiOff, CheckCircle2 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      id: 1,
      title: "የተማሪዎች ዲጂታል አስተዳደር",
      desc: "የተማሪዎችን መረጃ በአንድ ማዕከላዊ ቦታ በማደራጀት በቀላሉ ለማግኘት እና ለማስተዳደር ይረዳል።",
      icon: <Users className="text-blue-600" size={28} />,
      bg: "bg-blue-50"
    },
    {
      id: 2,
      title: "አውቶማቲክ የውጤት አስተዳደር",
      desc: "ሲስተሙ አማካይ፣ ድምር እና ደረጃን (Rank) በራሱ ያሰላል፤ የሰው ስህተትን ያስቀራል።",
      icon: <BarChart3 className="text-emerald-600" size={28} />,
      bg: "bg-emerald-50"
    },
    {
      id: 3,
      title: "ፈጣን ሪፖርት ማመንጨት",
      desc: "በአንድ ክሊክ ፕሮፌሽናል የሪፖርት ካርድ እና አጠቃላይ የክፍል ሰነዶችን (Rosters) ያዘጋጃል።",
      icon: <FileText className="text-purple-600" size={28} />,
      bg: "bg-purple-50"
    },
    {
      id: 4,
      title: "የተጠቃሚ ሚና እና ቁጥጥር",
      desc: "ለመምህራን፣ ለወላጆች እና ለአስተዳዳሪዎች የተለያየ የፈቃድ ደረጃ በመስጠት ደህንነትን ይጠብቃል።",
      icon: <Lock className="text-amber-600" size={28} />,
      bg: "bg-amber-50"
    },
    {
      id: 5,
      title: "የወላጆች ፖርታል",
      desc: "ወላጆች የልጆቻቸውን ውጤት፣ ባህሪ እና የክፍያ ሁኔታ በማንኛውም ሰዓት በስልካቸው ያያሉ።",
      icon: <LayoutDashboard className="text-rose-600" size={28} />,
      bg: "bg-rose-50"
    },
    {
      id: 6,
      title: "የቡድን ምዝገባ (Bulk Import)",
      desc: "በሺዎች የሚቆጠሩ ተማሪዎችን መረጃ ከExcel ፋይል በቀጥታ ወደ ሲስተሙ በፍጥነት ያስገባል።",
      icon: <UploadCloud className="text-cyan-600" size={28} />,
      bg: "bg-cyan-50"
    },
    {
      id: 7,
      title: "የውጤት ትንተና (Risk Analytics)",
      desc: "ደካማ ውጤት ያላቸውን ተማሪዎች (ከ60% በታች) በመለየት ፈጣን ድጋፍ እንዲያገኙ ይረዳል።",
      icon: <AlertCircle className="text-red-600" size={28} />,
      bg: "bg-red-50"
    },
    {
      id: 8,
      title: "ዲጂታል መታወቂያ እና ምስክር ወረቀት",
      desc: "መታወቂያዎችን እና ሰርተፊኬቶችን ያለ ተጨማሪ የህትመት ወጪ በራስ-ሰር ያዘጋጃል።",
      icon: <IdCard className="text-indigo-600" size={28} />,
      bg: "bg-indigo-50"
    },
    {
      id: 9,
      title: "ዘመናዊ ግንኙነት እና ላይብረሪ",
      desc: "ማሳሰቢያዎችን ለወላጆች መላክ እና መጻሕፍትን በዲጂታል መንገድ ማጋራት ያስችላል።",
      icon: <Bell className="text-orange-600" size={28} />,
      bg: "bg-orange-50"
    },
    {
      id: 10,
      title: "የብዙ ቋንቋ አማራጭ",
      desc: "በእንግሊዝኛ፣ በአማርኛ፣ በኦሮሚኛ፣ በትግርኛ፣ በሶማሊኛ እና በአፋርኛ ቋንቋዎች ይሰራል።",
      icon: <Globe2 className="text-teal-600" size={28} />,
      bg: "bg-teal-50"
    },
    {
      id: 11,
      title: "ከኢንተርኔት ነጻ መረጃ መሙላት",
      desc: "ኢንተርኔት በሌለበት ውጤት ሞልተው በኋላ ላይ ወደ ሲስተሙ መጫን (Upload) ያስችላል።",
      icon: <WifiOff className="text-slate-600" size={28} />,
      bg: "bg-slate-50"
    },
    {
      id: 12, // ተጨማሪ ለዲዛይኑ ማሟያ
      title: "ተጨማሪ ጥቅሞች",
      desc: "የኢትዮጵያን የትምህርት ፖሊሲ (70/30) መሰረት ያደረገ እና ለአጠቃቀም ቀላል።",
      icon: <CheckCircle2 className="text-green-600" size={28} />,
      bg: "bg-green-50"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            የሲስተሙ ዋና ዋና አገልግሎቶች
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            ትምህርት ቤትዎን በዘመናዊ ቴክኖሎጂ ለማገዝ የሚያስፈልጉ 11+ የተሟሉ አገልግሎቶች።
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div 
              key={f.id} 
              className="p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 group bg-white"
            >
              <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight">
                {f.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;