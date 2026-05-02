import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Menu, X,PlayCircle ,
  Users, BarChart3, FileText, Lock, LayoutDashboard, 
  UploadCloud, AlertCircle, IdCard, Bell, Globe2, WifiOff, CheckCircle2,
  Target, Heart, Award
} from "lucide-react";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
  { 
    id: 1, 
    title: "የተማሪዎች ዲጂታል አስተዳደር", 
    desc: "የተማሪዎችን መረጃ በአንድ ማዕከላዊ ቦታ በማደራጀት በቀላሉ ለማግኘት እና ለማስተዳደር ይረዳል።", 
    icon: <Users className="text-slate-600" size={28} />, 
    bg: "bg-slate-50" 
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
    title: "የማስታወቂያ ስርዓት", 
    desc: "ለተማሪዎች፣ ለመምህራን እና ለወላጆች አስፈላጊ ማስታወቂያዎችን በፍጥነት ማስረከብ።", 
    icon: <Bell className="text-orange-600" size={28} />, 
    bg: "bg-orange-50" 
  },
  { 
    id: 10, 
    title: "ኦንላይን እና ኦፍላይን ድጋፍ", 
    desc: "የኢንተርኔት ችግር ቢኖርም ስርዓቱ በቀጥታ እንዲሰራ የሚያስችል የቴክኖሎጂ ድጋፍ።", 
    icon: <WifiOff className="text-gray-600" size={28} />, 
    bg: "bg-gray-50" 
  }
];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-100">
      
      {/* 1. NAVIGATION WITH MOBILE MENU */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-slate-900 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center ">
              <span className="text-white font-black text-xl">N</span>
            </div>
            <span className="font-black text-xl tracking-tight text-slate-100 uppercase italic">Nitsuh</span>
          </div>

          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#about" className="text-sm amharic-font font-bold text-slate-200 hover:text-slate-600 transition">ስለ እኛ</a>
            <a href="#features" className="text-sm amharic-font font-bold text-slate-200 hover:text-slate-600 transition">አገልግሎቶች</a>
            <Link to="/login" className="bg-slate-500 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-200 transition-all">
              Login
            </Link>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay (Visible only when isMenuOpen is true) */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-slate-900 border-b border-slate-100 p-6 flex flex-col gap-6 shadow-xl animate-in slide-in-from-top duration-300">
            <a 
              href="#about" 
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-bold text-slate-200 hover:text-slate-100"
            >
              ስለ እኛ
            </a>
            <a 
              href="#features" 
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-bold text-slate-200 hover:text-slate-100"
            >
              አገልግሎቶች
            </a>
            <Link 
              to="/login" 
              onClick={() => setIsMenuOpen(false)}
              className="bg-slate-600 text-white px-6 py-4 rounded-2xl font-black text-center"
            >
              Login
            </Link>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="bg-gradient-to-br mt-26 from-slate-600 to-slate-900 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <h1 className="!amharic-font text-4xl md:text-5xl font-bold leading-tight mb-6">
            ዘመናዊ የትምህርት ቤት  
            <span className="text-yellow-300 !amharic-font"> አስተዳደር ሲስተም</span>
          </h1>

          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8 !amharic-font">
            የተማሪ መረጃ፣ ውጤት፣ ሪፖርት ካርድ እና የትምህርት ቤት ስራዎችን በአንድ ዘመናዊ ዲጂታል ሲስተም ያስተዳድሩ።
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link to="/login" className="bg-slate-900 text-white px-10 py-4.5 rounded-xl font-bold text-sm hover:bg-slate-600 transition-all flex items-center justify-center">
              የልጅዎን ውጤት ይዩ
            </Link>
            <Link to="https://nitsuh-academy.netlify.app/login?mode=demo" target="_blank" rel="noopener noreferrer" className="px-10 py-4.5 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group" > <PlayCircle size={20} className="text-slate-600 group-hover:scale-125 transition-transform" /> Demo ይመልከቱ </Link>
          </div>

        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">

          <div>
            <h3 className="text-4xl font-bold text-slate-600">1000+</h3>
            <p className="text-gray-500">Students Managed</p>
          </div>

          <div>
            <h3 className="text-4xl font-bold text-slate-600">1+</h3>
            <p className="text-gray-500">Schools Using the System</p>
          </div>

          <div>
            <h3 className="text-4xl font-bold text-slate-600">99%</h3>
            <p className="text-gray-500">Accuracy in Results</p>
          </div>

        </div>
      </section>

      <section id="about" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-square bg-slate-100 rounded-[3rem] relative overflow-hidden border-8 border-white shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center p-12">
                   <div className="text-center">
                      <Target className="text-slate-600 mx-auto mb-4" size={60} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Our Mission</p>
                   </div>
                </div>
              </div>
              {/* Floating Stat Card */}
              <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hidden md:block">
                <p className="text-4xl font-black text-slate-600 italic">100%</p>
                <p className="text-slate-500 font-bold text-sm uppercase">Digital Efficiency</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                ስለ Nitsuh School Management <br/> 
                <span className="text-slate-600 text-2xl tracking-normal font-bold">ቴክኖሎጂ ለትምህርት ጥራት</span>
              </h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Nitsuh SMS የተመሰረተው በትምህርት ቤቶች ውስጥ ያለውን የአስተዳደር ስራ በማቀለል፣ መምህራን በወረቀት ስራ ከመጠመድ ይልቅ ለተማሪዎቻቸው ትኩረት እንዲሰጡ ለማስቻል ነው። 
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <Heart className="text-rose-500" size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">ለሁሉም ተደራሽ</h4>
                    <p className="text-slate-500 text-sm">ከከተማ እስከ ገጠር፣ ኢንተርኔት ባለበትም በሌለበትም ቦታ እንዲሰራ ሆኖ ተገንብቷል።</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <Award className="text-amber-500" size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">ጥራት እና ደህንነት</h4>
                    <p className="text-slate-500 text-sm">የተማሪዎች መረጃ በአስተማማኝ ሁኔታ የተጠበቀ እና በማንኛውም ሰዓት ዝግጁ ነው።</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID */}
      <div id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 mx-4">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
          >
            <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${feature.bg} mb-4`}>
              {feature.icon}
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-slate-600 transition">
              {feature.title}
            </h3>

            <p className="text-gray-500 text-sm leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 5. CALL TO ACTION */}
      <section className="bg-slate-700 mt-4 text-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          የትምህርት ቤትዎን አስተዳደር ዘመናዊ ያድርጉ
        </h2>

        <Link
          to="https://t.me/nitsuhal"
          className="bg-white text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          አሁን ይጀምሩ
        </Link>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} <Link className="text-gray-700"
          to={"https://gkidanme.netlify.app"}>Gebrekidan Mequanint.</Link>
        </p>
      </footer>

    </div>
  );
};

export default LandingPage;