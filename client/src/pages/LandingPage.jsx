import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LandingPage = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="font-sans text-gray-700 bg-white">
      
      {/* --- 1. PUBLIC NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <img src="/er-192.png" alt="Logo" className="h-10 w-10 md:h-12 md:w-12" />
              <div>
                <h1 className="text-xl md:text-2xl font-black text-blue-900 uppercase tracking-tighter leading-none">
                  {t('app_name')}
                </h1>
                <p className="text-[10px] md:text-xs font-bold text-yellow-600 uppercase tracking-widest">
                  Excellence in Education
                </p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-bold text-gray-600 hover:text-blue-900 uppercase transition-colors">{t('home')}</a>
              <a href="#about" className="text-sm font-bold text-gray-600 hover:text-blue-900 uppercase transition-colors">{t('about_us')}</a>
              <a href="#academics" className="text-sm font-bold text-gray-600 hover:text-blue-900 uppercase transition-colors">{t('academics')}</a>
              <a href="#contact" className="text-sm font-bold text-gray-600 hover:text-blue-900 uppercase transition-colors">{t('contact')}</a>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <LanguageSwitcher />

              {/* THE LOGIN BUTTON (Gateway to SMS) */}
              <Link to="/login" className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-transform transform hover:-translate-y-0.5">
                {t('login_portal')} &rarr;
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
               <LanguageSwitcher />
               <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 focus:outline-none">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 shadow-lg flex flex-col gap-4 text-center">
              <a href="#home" onClick={() => setIsMenuOpen(false)} className="font-bold text-gray-700">{t('home')}</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="font-bold text-gray-700">{t('about_us')}</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="font-bold text-gray-700">{t('contact')}</a>
              <Link to="/login" className="bg-blue-900 text-white py-2 rounded-lg font-bold">{t('login_portal')}</Link>
          </div>
        )}
      </nav>

      {/* --- 2. HERO SECTION --- */}
      <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-blue-50 overflow-hidden">
        {/* Background Blob Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
                Building the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600">Future Generation</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('hero_text')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/login" className="px-8 py-4 bg-blue-900 text-white font-bold rounded-full shadow-xl hover:bg-blue-800 transition-all">
                    {t('check_results')}
                </Link>
                <a href="#about" className="px-8 py-4 bg-white text-blue-900 border-2 border-blue-100 font-bold rounded-full hover:border-blue-900 transition-all">
                    {t('learn_more')}
                </a>
            </div>
            
            {/* Hero Image / Placeholder */}
            <div className="mt-16 mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img src="/hero-school.jpg" alt="School Life" className="w-full h-auto object-cover opacity-90" />
            </div>
        </div>
      </section>

      {/* --- 3. ABOUT / STATS --- */}
      <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                      <h4 className="text-blue-600 font-bold uppercase tracking-widest mb-2">{t('about_us')}</h4>
                      <h2 className="text-4xl font-bold text-gray-900 mb-6">{t('about_title')}</h2>
                      <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                          {t('about_desc_1')}
                      </p>
                      <p className="text-gray-600 leading-relaxed mb-6">
                          {t('about_desc_2')}
                      </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-6 rounded-2xl text-center">
                          <span className="block text-4xl font-black text-blue-900">1000+</span>
                          <span className="text-sm font-bold text-gray-500 uppercase">{t('students')}</span>
                      </div>
                      <div className="bg-yellow-50 p-6 rounded-2xl text-center">
                          <span className="block text-4xl font-black text-yellow-600">50+</span>
                          <span className="text-sm font-bold text-gray-500 uppercase">{t('teachers')}</span>
                      </div>
                      <div className="bg-green-50 p-6 rounded-2xl text-center">
                          <span className="block text-4xl font-black text-green-600">100%</span>
                          <span className="text-sm font-bold text-gray-500 uppercase">{t('pass_rate')}</span>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-2xl text-center">
                          <span className="block text-4xl font-black text-purple-600">10+</span>
                          <span className="text-sm font-bold text-gray-500 uppercase">Years</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- 4. PROGRAMS / ACADEMICS --- */}
      <section id="academics" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-12">{t('our_programs')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* KG */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border-t-4 border-pink-400">
                      <div className="text-6xl mb-4">🧸</div>
                      <h3 className="text-xl font-bold mb-2">{t('level_kg')}</h3>
                      <p className="text-gray-500">{t('kg_desc')}</p>
                  </div>
                  {/* Primary */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border-t-4 border-blue-500">
                      <div className="text-6xl mb-4">📘</div>
                      <h3 className="text-xl font-bold mb-2">{t('level_primary')}</h3>
                      <p className="text-gray-500">{t('primary_desc')}</p>
                  </div>
                  {/* Activities */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border-t-4 border-green-500">
                      <div className="text-6xl mb-4">⚽</div>
                      <h3 className="text-xl font-bold mb-2">{t('activities')}</h3>
                      <p className="text-gray-500">{t('activities_desc')}</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- 5. FOOTER / CONTACT --- */}
      <footer id="contact" className="bg-blue-900 text-white py-16">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                  <h2 className="text-2xl font-bold mb-4">{t('app_name')}</h2>
                  <p className="text-blue-200">
                      Empowering students to achieve their dreams through quality education and moral excellence.
                  </p>
              </div>
              <div>
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-blue-300">{t('contact_us')}</h3>
                  <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                          <span>📍</span> Addis Ababa, Ethiopia
                      </li>
                      <li className="flex items-center gap-3">
                          <span>📞</span> +251 911 00 00 00
                      </li>
                      <li className="flex items-center gap-3">
                          <span>✉️</span> info@freedomschool.com
                      </li>
                  </ul>
              </div>
              <div>
                   <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-blue-300">Portal</h3>
                   <Link to="/login" className="inline-block bg-yellow-500 text-blue-900 font-bold px-6 py-2 rounded hover:bg-yellow-400">
                       {t('login_portal')}
                   </Link>
              </div>
          </div>
          <div className="text-center border-t border-blue-800 mt-12 pt-8 text-blue-400 text-sm">
              &copy; 2024 Freedom KG & Primary School. Powered by <Link to="https://astounding-lily-ee0971.netlify.app/" className="text-white font-bold">Gebrekidan Mequanint</Link>.
          </div>
      </footer>

    </div>
  );
};

export default LandingPage;