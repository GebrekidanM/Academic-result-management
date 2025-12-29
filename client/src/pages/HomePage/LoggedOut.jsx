import React from 'react'

function LoggedOut() {
  return (
        <div className="bg-gray-50">
            {/* --- Hero Section --- */}
            <div className="text-center py-20 md:py-32 px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 tracking-tight">
                    Welcome to <span className="text-pink-600">Nitsuh</span>
                </h1>
                <h2 className="text-4xl md:text-6xl font-extrabold text-gray-800 tracking-tight mt-2">
                    School Management System
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                    A modern, real-time platform designed to seamlessly manage student academics, reports, and school-parent communications.
                </p>
            </div>

            {/* --- Features Section --- */}
            <div className="py-16 bg-white">
                <div className="container mx-auto px-6">
                    <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Powerful Features for a Modern School</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="text-center p-6 border border-gray-200 rounded-lg">
                            <div className="text-pink-500 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h4 className="font-bold text-xl mb-2">Comprehensive Reporting</h4>
                            <p className="text-gray-600">Generate beautiful, printable report cards and detailed class rosters with automatic calculations for totals, averages, and ranks.</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="text-center p-6 border border-gray-200 rounded-lg">
                            <div className="text-pink-500 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2m8-4H5a2 2 0 00-2 2v10a2 2 0 002 2h11l4 4V7a2 2 0 00-2-2z" /></svg>
                            </div>
                            <h4 className="font-bold text-xl mb-2">Real-Time Notifications</h4>
                            <p className="text-gray-600">Keep administrators and homeroom teachers instantly informed with in-app and push notifications for important events like grade updates.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="text-center p-6 border border-gray-200 rounded-lg">
                            <div className="text-pink-500 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h4 className="font-bold text-xl mb-2">Role-Based Security</h4>
                            <p className="text-gray-600">A secure system with distinct roles for Admins, Teachers, and Parents, ensuring users only see the information relevant to them.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Demo Login Section --- */}
            <div className="bg-gray-800 text-white py-16">
                <div className="container mx-auto text-center px-6">
                    <h2 className="text-3xl font-bold mb-4">Explore the Live Demo</h2>
                    <p className="text-gray-300 mb-8">Click a button below to automatically log in with pre-defined demo credentials and experience the system firsthand.</p>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                        <button
                            onClick={() => navigate('/login', { state: { username: 'admin', password: 'admin@123' } })}
                            className="w-full md:w-auto bg-pink-600 hover:bg-pink-500 font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                            Login as Administrator
                        </button>
                        <button
                            onClick={() => navigate('/login', { state: { username: 'bchebud', password: 'Bchebud@123' } })}
                            className="w-full md:w-auto bg-gray-600 hover:bg-gray-500 font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                            Login as Teacher
                        </button>
                        <button
                            onClick={() => navigate('/login', { state: { username: 'bchebud', password: 'Bchebud@123' } })}
                            className="w-full md:w-auto bg-gray-600 hover:bg-gray-500 font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                            Login as Parent
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-8">
                        (Parents can log in at the <Link to="/parent-login" className="text-pink-400 hover:underline">Parent Portal</Link>)
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoggedOut