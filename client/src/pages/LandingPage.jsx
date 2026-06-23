import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Sparkles, Globe2, ShieldCheck, Users, WifiOff, BarChart3, 
  ChevronRight, AlertTriangle, CheckCircle2, BookOpen, GraduationCap, 
  Bell, FileText, UserCheck 
} from "lucide-react";
import axios from "axios";
import heroImage from "../shared/assests/ai-school-hero.png";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";

// Animation Presets for Clean Code Structure
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  
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
      setLoadingRole(role);
      setErrorMsg("");

      const baseUrl = "https://academic-result-management.onrender.com/api";
      let endpoint = `${baseUrl}/auth/login`;
      let payload = {};

      if (role === "admin") {
        payload = { username: 'admin', password: 'admin@123' };
      } else if (role === "teacher") {
        payload = { username: '1', password: '123456' };
      } else if (role === "parent") {
        endpoint = `${baseUrl}/student-auth/login`;
        payload = { studentId: 'FKS-2018-008', password: '123456' };
      }

      const response = await axios.post(endpoint, payload);

      if (response.data && response.data.token) {
        const storageKey = role === "parent" ? 'student-user' : 'user';
        localStorage.setItem(storageKey, JSON.stringify(response.data));
        
        if (role === "parent") {
          navigate(response.data.isInitialPassword ? '/parent/change-password' : '/parent/dashboard');
        } else {
          navigate('/');
        }
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || t('error') || 'Login failed.');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 selection:bg-blue-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.05 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-blue-200/50"
            >
              <Brain className="text-white" size={24} />
            </motion.div>
            <div>
              <h2 className="font-black text-lg text-slate-950 tracking-tight">Nitsuh AI</h2>
              <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest">School Intelligence</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#ai" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">AI Engine</a>
            <a href="#demo" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Demo</a>
            <Link to="/login" className="px-6 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-950/20 hover:-translate-y-0.5">Login</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-28 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/50 overflow-hidden">
        {/* Animated Background Light Blobs */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-150px] left-[-150px] w-[450px] h-[450px] bg-gradient-to-tr from-blue-300/30 to-indigo-300/20 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute right-[-100px] top-[10%] w-[400px] h-[400px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" 
        />
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm mb-6">
              <Sparkles size={14} className="text-blue-600 animate-pulse" />
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">AI Powered Education Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-slate-950">
              Intelligent<br />School<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Management Platform</span>
            </h1> 

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              AI-powered academic intelligence platform for Ethiopian schools featuring predictive deep analytics, multilingual local frameworks, and unified communication tools.
            </p>

            <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium italic">
              ዘመናዊ በAI የተደገፈ የትምህርት ቤት አስተዳደር። የተማሪ ውጤት ትንተና፣ የወላጅ ፖርታል እና የሪስክ ትንበያ ሲስተም።
            </p>

            <div className="mt-8 flex justify-center lg:justify-start">
              <Link
                to="/login"
                className="group px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-1"
              >
                Launch Platform
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* RIGHT HERO DECORATION */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative order-1 lg:order-2"
          >
            <div className="absolute inset-0 bg-blue-400/10 blur-3xl rounded-full scale-110 pointer-events-none" />
            
            {/* FLOATING PERFORMANCE CARD */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-6 top-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white p-4 z-20 hidden sm:flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                <h3 className="text-xl font-black text-slate-900">99.9%</h3>
              </div>
            </motion.div>

            {/* FLOATING INSIGHT CARD */}
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white p-4 z-20 hidden sm:flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Brain size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Engine</p>
                <h3 className="text-sm font-black text-slate-900">Active Risk Check</h3>
              </div>
            </motion.div>

            <motion.img
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.3 }}
              src={heroImage}
              alt="AI School Platform Dashboard preview"
              className="relative z-10 w-full rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10"
            />
          </motion.div>
        </div>
      </section>

      {/* TRUST METRICS STRIP */}
      <section className="pb-24 bg-white/40">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
          >
            {trustItems.map((item, index) => (
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02 }}
                key={index} 
                className="bg-white rounded-2xl border border-slate-200/60 p-6 text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-center mb-3 text-blue-600">{item.icon}</div>
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">{item.value}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION COMPARISON */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-black tracking-tight mb-8 text-slate-100">Legacy Friction points</h2>
            <div className="space-y-4">
              {[
                "Prone to human entry mistakes during manual ranking calculations.",
                "Fragmented parent communication models leading to drop-out alerts.",
                "Sluggish, slow, paper-heavy physical student registry infrastructure."
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <AlertTriangle className="text-rose-400 mt-1 shrink-0" size={20} />
                  <p className="text-slate-400 font-medium">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-black tracking-tight mb-8 text-blue-400">Nitsuh Engine Model</h2>
            <div className="space-y-4">
              {[
                "Automated score distributions and instantaneous rank evaluation.",
                "Multilingual dashboards ensuring inclusive family metrics visualization.",
                "Machine Learning predictors mapping systemic learner issues pre-collapse."
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/[0.03] border border-blue-500/10">
                  <CheckCircle2 className="text-emerald-400 mt-1 shrink-0" size={20} />
                  <p className="text-slate-300 font-medium">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMPREHENSIVE FEATURES GRID */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">Platform Framework Features</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium">All specialized tools required by modern administrators encapsulated inside an elegant environment.</p>
          </div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                key={index} 
                className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-950 tracking-tight">{feature.title}</h3>
                <p className="mt-3 text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LIVE INTERACTIVE DEMO PORTS */}
      <section id="demo" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-950 tracking-tight">Explore Live Demo Instances</h2>
            <p className="mt-3 text-slate-500 font-medium">Test structural system nodes directly with predefined role frameworks.</p>
            {errorMsg && (
              <motion.p initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-4 text-rose-600 font-bold bg-rose-50 inline-block px-4 py-2 rounded-xl border border-rose-200">
                {errorMsg}
              </motion.p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {demos.map((demo, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={index} 
                className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 flex flex-col justify-between shadow-xl shadow-slate-100/40 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm">
                    {demo.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">{demo.title}</h3>
                  <p className="mt-3 text-slate-500 text-sm leading-relaxed font-medium">{demo.desc}</p>
                </div>
                
                <button 
                  onClick={() => loginDemo(demo.route)}
                  className="bg-slate-950 hover:bg-blue-600 mt-8 flex flex-row items-center justify-center w-full text-white text-sm font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md disabled:opacity-40"
                  disabled={loadingRole !== null}
                >
                  {loadingRole === demo.route ? (
                    <span className="flex items-center gap-2 animate-pulse">Authenticating Portal...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Enter Environment
                      <ChevronRight size={16} />
                    </span>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE CTA MATURING */}
      <section className="py-24 px-6 bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-12 md:p-16 text-center text-white overflow-hidden relative shadow-2xl"
        >
          <div className="absolute top-[-100px] right-[-100px] w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <GraduationCap size={56} className="mx-auto mb-6 text-blue-400" />
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Transition Your Infrastructure<br />Into An Intelligent Space
          </h2>
          <p className="mt-6 text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Deploy decentralized modern cloud tools wrapped in machine learning capabilities today.
          </p>
          <div className="mt-10 flex justify-center">
            <a
              href="https://t.me/nitsuhal"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5"
            >
              Contact Integrations Team
            </a>
          </div>
        </motion.div>
      </section>

      {/* FOOTER FRAME */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-center">
        <h2 className="text-xl font-bold text-white tracking-tight">Nitsuh AI</h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">Next Generation Academic Ecosystems for East Africa.</p>
        <p className="mt-8 text-xs text-slate-600 font-medium">
          © {new Date().getFullYear()} Nitsuh Tech. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;