import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const ActionCard = ({ to, title, description, state = {}, icon }) => {
    const { t } = useTranslation();
    
    return (
        <div className="group relative bg-white border border-slate-200 rounded-sm p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 hover:border-gray-500/40 flex flex-col h-full cursor-pointer">
            
            {/* Optional Icon Container */}
            {icon && (
                <div className="w-11 h-11 rounded-xl bg-pink-600 border border-slate-100 flex items-center justify-center mb-5 text-slate-200 font-bold transition-colors duration-300 group-hover:text-gray-600 group-hover:bg-blue-50 group-hover:border-blue-200">
                    {icon}
                </div>
            )}

            {/* Content */}
            <h3 className="font-semibold text-lg tracking-tight text-slate-900 mb-2">
                {title}
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
                {description}
            </p>

            {/* Sleek Action Link */}
            <Link to={to} state={state} className="bg-pink-600 hover:bg-slate-700 flex items-center justify-center  text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                {t('Go')} 
                <svg 
                    className="w-4 h-4 ml-1.5 transform transition-transform duration-300 ease-out group-hover:translate-x-1.5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </Link>
                        
            {/* Hidden absolute link to make the whole card clickable while preserving SEO/accessibility */}
            <Link to={to} state={state} className="absolute inset-0 z-10" aria-label={`Go to ${title}`} />
        </div>
    );
};

export default ActionCard;