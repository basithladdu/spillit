import React from 'react';

function Footer() {
  return (
    <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-6">
      <div className="flex justify-center items-center space-x-4">
        <a 
          href="https://support.google.com/maps/answer/2839911" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          how to enable gps/geotagging?
        </a>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <a 
          href="https://twitter.com/fixitapp" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          follow us on twitter
        </a>
      </div>
    </footer>
  );
}

export default Footer;