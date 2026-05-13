import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain,Sparkles,Globe2,ShieldCheck,Users,WifiOff,BarChart3,ChevronRight,PlayCircle, AlertTriangle,
  CheckCircle2,BookOpen, GraduationCap, Bell, FileText, UserCheck } from "lucide-react";
import axios from "axios";
import heroImage from "../assests/ai-school-hero.png";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading,setLoading] = useState(false)
  
  const trustItems = [
    { icon: <Users size={28} className="text-blue-600" />, value: "700+", label: "Students" },
    { icon: <Brain size={28} className="text-blue-600" />, value: "AI", label: "Powered" },
    { icon: <Globe2 size={28} className="text-blue-600" />, value: "6", label: "Languages" },
    { icon: <WifiOff size={28} className="text-blue-600" />, value: "24/7", label: "Access" },
    { icon: <ShieldCheck size={28} className="text-blue-600" />, value: "Safe", label: "Cloud" },
    { icon: <BarChart3 size={28} className="text-blue-600" />, value: "Smart", label: "Analytics" }
  ];
  const features = [
    { icon: <Users size={32} className="text-blue-600" />, title: "Student Management", desc: "Centralized digital student information management." },
    { icon: <BarChart3 size={32} className="text-blue-600" />, title: "Automated Results", desc: "Automatic ranking, averages and analytics." },
    { icon: <FileText size={32} className="text-blue-600" />, title: "Report Cards", desc: "Professional digital report generation." },
    { icon: <Bell size={32} className="text-blue-600" />, title: "Parent Notifications", desc: "Real-time parent communication system." },
    { icon: <Brain size={32} className="text-blue-600" />, title: "AI Insights", desc: "Gemini-powered semester analysis." },
    { icon: <WifiOff size={32} className="text-blue-600" />, title: "Offline Support", desc: "Work even with unstable internet access." }
  ];
  const demos = [
    {
      title: "Admin Demo",
      desc: "School analytics, AI reports, management and dashboards.",
      route: "admin",
      icon: <ShieldCheck size={36} className="text-blue-600" />
    },
    {
      title: "Teacher Demo",
      desc: "Assessment, grading and academic management experience.",
      route: "teacher",
      icon: <BookOpen size={36} className="text-blue-600" />
    },
    {
      title: "Parent Demo",
      desc: "Results, AI semester insights and student progress tracking.",
      route: "parent",
      icon: <UserCheck size={36} className="text-blue-600" />
    }
  ];

   const loginDemo = async (role) => {
          try {
            setLoading(true)
              if (role === "admin") {
                  const response = await axios.post(`https://academic-result-management.onrender.com/api/auth/login`,{
                      username:'admin',
                      password:'admin@123'
                  });

                  if (response.data.token) {
                      localStorage.setItem('user', JSON.stringify(response.data));
                      navigate('/');
                      window.location.reload();
                  }
              } 
              else if (role === "parent") {
                  const response = await axios.post(`https://academic-result-management.onrender.com/api/student-auth/login`,{
                      studentId:'FKS-2018-008',
                      password:'123456'
                  });
                  if (response.data.token) {
                      localStorage.setItem('student-user', JSON.stringify(response.data));
  
                      if (response.data.isInitialPassword) {
                          navigate('/parent/change-password');
                      } else {
                          navigate('/parent/dashboard');
                      }
                      window.location.reload();
                  }
              } 
              else if (role === "teacher") {
                  const response = await axios.post(`https://academic-result-management.onrender.com/api/auth/login`,{
                      username:'1',
                      password:'123456'
                  });

                  if (response.data.token) {
                      localStorage.setItem('user', JSON.stringify(response.data));
                      navigate('/');
                      window.location.reload();
                  }
              } 
          } catch (err) {
              console.error(err);
              const msg = err.response?.data?.message || t('error') || 'Login failed.';
          }finally{
              setLoading(false);
          }
      };

  return (

    <div className="min-h-screen bg-[#F8FAFC] overflow-hidden text-slate-900">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-600 to-slate-900 flex items-center justify-center shadow-lg shadow-blue-200/40">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900">Nitsuh AI</h2>
              <p className="text-xs text-slate-500 font-bold">School Intelligence Platform</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-all">Features</a>
            <a href="#ai" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-all">AI Engine</a>
            <a href="#demo" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-all">Demo</a>
            <Link to="/login" className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black hover:scale-[1.02] transition-all">Login</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 md:pt-40 pb-16 md:pb-24 overflow-hidden">
        {/* BACKGROUND GLOW */}
        <div className="absolute top-[-200px] left-[-200px] w-[320px] md:w-[500px] h-[320px] md:h-[500px] bg-blue-200/40 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 lg:gap-16 items-center relative z-10">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
              <Sparkles size={15} className="text-blue-600" />
              <span className="text-xs sm:text-sm font-black text-slate-700">
                AI Powered Education Platform
              </span>
            </div>

            {/* TITLE */}
            <h1 className="mt-7 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-slate-900">
              Intelligent
              <br />
              School
              <br />
              <span className="text-blue-600">
                Management
              </span>
            </h1>

            {/* ENGLISH */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              AI-powered academic intelligence platform for Ethiopian schools with analytics, multilingual support, parent portals and smart educational insights.
            </p>

            {/* AMHARIC */}
            <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              ዘመናዊ በAI የተደገፈ የትምህርት ቤት አስተዳደር።
              የተማሪ ውጤት ትንተና፣ የወላጅ ፖርታል እና
              የሪስክ ትንበያ ሲስተም።
            </p>

            {/* BUTTON */}
            <div className="mt-8 sm:mt-10 flex justify-center lg:justify-start">
              <Link
                to="/login"
                className="group px-7 sm:px-8 py-3.5 sm:py-4 rounded-3xl bg-blue-600 text-white font-black flex items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-lg shadow-blue-200/40"
              >
                Launch Platform
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-all"
                />
              </Link>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative order-1 lg:order-2 mt-4 lg:mt-0"
          >
            {/* GLOW */}
            <div className="absolute inset-0 bg-blue-200/30 blur-3xl rounded-full scale-110" />
            {/* FLOATING CARD 1 */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute left-2 sm:left-0 lg:-left-8 top-4 sm:top-10 bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-3 sm:p-5 z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="text-blue-600" size={20} />
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-500">
                    Performance
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900">
                    99.9%
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* FLOATING CARD 2 */}
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute right-2 sm:right-0 lg:-right-6 bottom-4 sm:bottom-10 bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-3 sm:p-5 z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Brain className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-500">
                    AI Insight
                  </p>
                  <h3 className="text-sm sm:text-lg font-black text-slate-900">
                    Stable Progress
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* IMAGE */}
            <img
              src={heroImage}
              alt="AI School Platform"
              className="relative z-10 w-full rounded-[2rem] border border-slate-200 shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {trustItems.map((item, index) => (
              <div key={index} className="bg-[#e8eaeb] rounded-sm border border-slate-200 p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  {item.value}
                </h3>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-black mb-10">
              Traditional School Problems
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-red-400 mt-1" />
                <p className="text-slate-300 text-lg">Manual ranking and report errors</p>
              </div>
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-red-400 mt-1" />
                <p className="text-slate-300 text-lg">Weak parent communication systems</p>
              </div>
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-red-400 mt-1" />
                <p className="text-slate-300 text-lg">Paper-based academic management</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-black mb-10 text-blue-400">
              Nitsuh AI Solution
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-green-400 mt-1" />
                <p className="text-slate-300 text-lg">AI-powered academic intelligence</p>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-green-400 mt-1" />
                <p className="text-slate-300 text-lg">Automated analytics and ranking</p>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-green-400 mt-1" />
                <p className="text-slate-300 text-lg">Multilingual parent portal access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Platform Features</h2>
            <p className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">Everything schools need to manage education intelligently and efficiently.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#e8eaeb] rounded-sm border border-slate-200 p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-4 text-slate-500 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section id="ai" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
            <Brain size={16} className="text-blue-600" />
            <span className="text-sm font-black text-slate-700">Gemini 2.5 Flash Powered</span>
          </div>

          <h2 className="text-5xl font-black text-slate-900 tracking-tight">
            AI Intelligence Engine
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-500 leading-relaxed font-medium">
            AI-generated semester analysis, multilingual recommendations, student risk prediction and intelligent academic insights for parents, teachers and administrators.
          </p>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-[#e8eaeb] rounded-sm border border-slate-200 p-8 text-left hover:-translate-y-1 hover:shadow-lg transition-all">
              <Brain className="text-blue-600" size={42} />
              <h3 className="mt-6 text-2xl font-black text-slate-900">Semester AI Insights</h3>
              <p className="mt-4 text-slate-500 leading-relaxed">Automatic strengths, weaknesses and recommendations generated per semester.</p>
            </div>
            <div className="bg-[#e8eaeb] rounded-sm border border-slate-200 p-8 text-left hover:-translate-y-1 hover:shadow-lg transition-all">
              <BarChart3 className="text-blue-600" size={42} />
              <h3 className="mt-6 text-2xl font-black text-slate-900">Risk Prediction</h3>
              <p className="mt-4 text-slate-500 leading-relaxed">Identify struggling students before academic performance declines.</p>
            </div>

            <div className="bg-[#e8eaeb] rounded-sm border border-slate-200 p-8 text-left hover:-translate-y-1 hover:shadow-lg transition-all">
              <Globe2 className="text-blue-600" size={42} />
              <h3 className="mt-6 text-2xl font-black text-slate-900">Multilingual AI</h3>
              <p className="mt-4 text-slate-500 leading-relaxed">AI-generated academic communication in English, Amharic, Oromo, Somali, Afar and Tigrinya.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Explore Live Demo</h2>
            <p className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto">Experience the platform from different user perspectives.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {demos.map((demo, index) => (
              <div key={index} className="bg-[#e8eaeb] rounded-sm border border-slate-200 p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
                  {demo.icon}
                </div>
                <h3 className="text-3xl font-black text-slate-900"> {demo.title} </h3>
                <p className="mt-4 text-slate-500 leading-relaxed font-medium"> {demo.desc} </p>
                
                <button onClick={() => loginDemo(demo.route)}
                        className=" bg-gradient-to-r from-blue-600 to-slate-900 mt-3 hover:bg-slate-700 flex items-center justify-center  text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        disabled={loading}
                >
                  {
                    loading ? 'Loging ...' : <span>
                      Enter Demo
                    <svg 
                        className="w-4 h-4 ml-1.5 transform transition-transform duration-300 ease-out group-hover:translate-x-1.5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    </span>
                  }
                       
                </button>
                
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-600 to-slate-900 rounded-sm p-14 text-center text-white overflow-hidden relative">
          <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl" />
          <GraduationCap size={60} className="mx-auto mb-8" />
          <h2 className="text-3xl md:text-5xl font-black leading-tight">
            Transform Your School Into
            <br />
            An Intelligent Digital Campus
          </h2>
          <p className="mt-6 text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Modern education infrastructure powered by AI, analytics and multilingual communication.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://t.me/nitsuhal"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-3xl bg-white text-slate-900 font-black hover:scale-[1.02] transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-14 px-6 text-center">
        <h2 className="text-2xl font-black text-white">
          Nitsuh AI
        </h2>
        <p className="mt-4 text-slate-400 max-w-xl mx-auto leading-relaxed">
          Modern Ethiopian AI Education Infrastructure.
        </p>
        <p className="mt-8 text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} Nitsuh AI School Platform.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
