import {Link} from "react-router-dom"
const StatCard = ({ title, value, icon ,link}) => (
    <Link to={link}>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center border-l-4 border-slate-800">
            <div className="bg-slate-800 text-slate-800 p-3 rounded-full mr-4">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </Link>
);

export default StatCard;