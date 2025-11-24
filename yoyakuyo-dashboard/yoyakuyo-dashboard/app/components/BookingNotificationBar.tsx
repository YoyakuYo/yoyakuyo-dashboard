// apps/dashboard/app/components/BookingNotificationBar.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface BookingNotification {
  id: string;
  customerName: string;
  serviceName?: string;
  date: string;
  time: string;
  isAICreated: boolean;
}

interface BookingNotificationBarProps {
  notification: BookingNotification | null;
  onDismiss: () => void;
  onViewBooking: (bookingId: string) => void;
}

export default function BookingNotificationBar({ 
  notification, 
  onDismiss, 
  onViewBooking 
}: BookingNotificationBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(), 300); // Wait for animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification || !isVisible) return null;

  return (
    <div className="fixed top-16 left-64 right-0 z-50 px-6 py-4 animate-slide-down">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">New Booking!</span>
              {notification.isAICreated && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                  🤖 AI Created
                </span>
              )}
            </div>
            <p className="text-sm text-blue-100">
              <span className="font-semibold">{notification.customerName}</span>
              {notification.serviceName && ` booked ${notification.serviceName}`}
              {` on ${notification.date} at ${notification.time}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewBooking(notification.id)}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss(), 300);
            }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

