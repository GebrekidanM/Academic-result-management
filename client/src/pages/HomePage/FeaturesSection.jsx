import React from "react";
import { 
  Users, BarChart3, FileText, Lock, LayoutDashboard, 
  UploadCloud, AlertCircle, IdCard, Bell, Globe2, WifiOff, CheckCircle2 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      id: 1,
      title: "Digital Student Management",
      desc: "Organize all student records in one central place for easy access and administration.",
      icon: <Users className="text-blue-600" size={28} />,
      bg: "bg-blue-50"
    },
    {
      id: 2,
      title: "Automated Grade Management",
      desc: "The system calculates averages, totals, and ranks automatically to minimize errors.",
      icon: <BarChart3 className="text-emerald-600" size={28} />,
      bg: "bg-emerald-50"
    },
    {
      id: 3,
      title: "Fast Report Generation",
      desc: "Generate professional report cards and class rosters with one click.",
      icon: <FileText className="text-slate-800" size={28} />,
      bg: "bg-purple-50"
    },
    {
      id: 4,
      title: "Role-Based Access Control",
      desc: "Protect data with role-specific permissions for teachers, parents, and administrators.",
      icon: <Lock className="text-amber-600" size={28} />,
      bg: "bg-amber-50"
    },
    {
      id: 5,
      title: "Parent Portal",
      desc: "Parents can check grades, behavior, and payment status anytime from their phones.",
      icon: <LayoutDashboard className="text-slate-800" size={28} />,
      bg: "bg-rose-50"
    },
    {
      id: 6,
      title: "Bulk Import",
      desc: "Import thousands of student records directly from Excel files quickly.",
      icon: <UploadCloud className="text-cyan-600" size={28} />,
      bg: "bg-cyan-50"
    },
    {
      id: 7,
      title: "Risk Analytics",
      desc: "Identify students below 60% quickly so intervention can happen early.",
      icon: <AlertCircle className="text-red-600" size={28} />,
      bg: "bg-red-50"
    },
    {
      id: 8,
      title: "Digital IDs and Certificates",
      desc: "Generate ID cards and certificates automatically with minimal overhead.",
      icon: <IdCard className="text-indigo-600" size={28} />,
      bg: "bg-indigo-50"
    },
    {
      id: 9,
      title: "Communication and Library",
      desc: "Send parent notifications and share educational resources digitally.",
      icon: <Bell className="text-orange-600" size={28} />,
      bg: "bg-orange-50"
    },
    {
      id: 10,
      title: "Multi-language Support",
      desc: "Works with English, Amharic, Oromo, Tigrinya, Somali, and Afar language options.",
      icon: <Globe2 className="text-teal-600" size={28} />,
      bg: "bg-teal-50"
    },
    {
      id: 11,
      title: "Offline Data Entry",
      desc: "Enter grades without internet and upload them later when connectivity is available.",
      icon: <WifiOff className="text-slate-600" size={28} />,
      bg: "bg-slate-50"
    },
    {
      id: 12,
      title: "Additional Benefits",
      desc: "Built for practical school workflows and easy day-to-day use.",
      icon: <CheckCircle2 className="text-green-600" size={28} />,
      bg: "bg-green-50"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            Core System Features
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            11+ complete features designed to help schools run smoothly with modern technology.
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