"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AnimatedLogo() {
  const [isVisible, setIsVisible] = useState(true);
  const [logoKey, setLogoKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setLogoKey(prev => prev + 1);
        setIsVisible(true);
      }, 500); // Fade out duration
    }, 4000); // Change logo every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Link 
      href="/"
      className="flex items-center gap-2 transition-opacity duration-500"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg transform transition-all duration-300 hover:scale-110">
        Y
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
        Yoyaku Yo
      </span>
    </Link>
  );
}

