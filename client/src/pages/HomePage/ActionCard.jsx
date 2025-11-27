import {Link} from "react-router-dom";

const ActionCard = ({ to, title, description, state = {} }) => (
    <div className="bg-gray-50 p-6 rounded-lg border border-white shadow-md hover:shadow-lg hover:border-pink-300 transition-all duration-200 flex flex-col">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 mt-1 flex-grow">{description}</p>
        <Link to={to} state={state} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200 text-center mt-auto">
            Go &rarr;
        </Link>
    </div>
);

export default ActionCard;