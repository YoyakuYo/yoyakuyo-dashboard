"use client";

import React, { useState } from 'react';
import SupportChat from './SupportChat';

interface FloatingHelpButtonProps {
  shopId?: string;
}

export default function FloatingHelpButton({ shopId }: FloatingHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!shopId) return null;

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="Contact Support"
      >
        <span className="text-2xl">?</span>
      </button>

      {/* Support Chat Window */}
      {isOpen && (
        <SupportChat
          shopId={shopId}
          onClose={() => setIsOpen(false)}
          isFloating={true}
        />
      )}
    </>
  );
}

