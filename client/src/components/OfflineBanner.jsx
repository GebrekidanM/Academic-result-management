import React, { useState, useEffect } from 'react';

const OfflineBanner = () => {
  // Initialize state based on current browser status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Define event handlers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for network changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners when component unmounts
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If online, do not render anything
  if (isOnline) {
    return null;
  }

  // If offline, render the warning bar
  return (
    <div className="sticky bottom-0 w-full bg-red-600 text-white text-center py-3 px-4 z-[9999] shadow-lg print:hidden animate-slide-up">
      <div className="flex items-center justify-center gap-2 font-bold text-sm md:text-base">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      </div>
    </div>
  );
};

export default OfflineBanner;