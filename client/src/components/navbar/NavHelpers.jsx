import { NavLink } from 'react-router-dom';

export const dropdownLinkClass = "block px-4 py-2 text-sm hover:bg-pink-100 hover:text-pink-600 transition-colors border-b md:border-none border-gray-100";
export const navLinkClass = ({ isActive }) => 
    `block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors whitespace-nowrap ${isActive ? 'bg-pink-600' : 'hover:bg-gray-700'}`;

export const NavDropdown = ({ title, children, isOpen, toggleOpen }) => (
    <div className="relative block md:inline-block">
        <button onClick={toggleOpen} className="text-white font-bold py-2 px-3 rounded-md hover:bg-gray-700 flex items-center gap-1 w-full md:w-auto justify-between">
            {title}
            <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
        </button>
        {isOpen && <div className="md:absolute right-0 mt-2 w-full md:w-56 bg-white rounded-md shadow-lg z-50 py-1 text-gray-800">{children}</div>}
    </div>
);