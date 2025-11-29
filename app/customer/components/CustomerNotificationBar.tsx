// app/customer/components/CustomerNotificationBar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerNotification {
  id: string;
  title: string;
  body: string;
  bookingId?: string;
  status?: string;
}

interface CustomerNotificationBarProps {
  notification: CustomerNotification | null;
  onDismiss: () => void;
  onViewBooking?: (bookingId: string) => void;
}

export default function CustomerNotificationBar({ 
  notification, 
  onDismiss,
  onViewBooking
}: CustomerNotificationBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'from-green-600 to-emerald-600';
      case 'cancelled':
        return 'from-red-600 to-rose-600';
      case 'completed':
        return 'from-blue-600 to-indigo-600';
      default:
        return 'from-blue-600 to-indigo-600';
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 lg:left-64 z-50 px-6 py-4 animate-slide-down">
      <div className={`bg-gradient-to-r ${getStatusColor(notification.status)} text-white rounded-lg shadow-lg p-4 flex items-center justify-between max-w-4xl mx-auto`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {notification.status === 'confirmed' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {notification.status === 'cancelled' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {notification.status === 'completed' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!notification.status && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">{notification.title}</span>
            </div>
            <p className="text-sm text-white/90">
              {notification.body}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {notification.bookingId && onViewBooking && (
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  onDismiss();
                  onViewBooking(notification.bookingId!);
                }, 300);
              }}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View
            </button>
          )}
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

