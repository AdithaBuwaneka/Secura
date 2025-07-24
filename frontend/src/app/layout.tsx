'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import AuthProvider from '@/components/AuthProvider';
import MessagingProvider from '@/components/messaging/MessagingProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Debug toast calls
if (typeof window !== 'undefined') {
  const originalToast = require('react-hot-toast').default;
  const originalError = originalToast.error;
  const originalSuccess = originalToast.success;
  
  originalToast.error = function(message: any, options?: any) {
    console.log('TOAST ERROR CALLED WITH:', message, typeof message);
    if (typeof message === 'object') {
      console.log('TOAST ERROR OBJECT KEYS:', Object.keys(message));
      console.log('TOAST ERROR OBJECT:', message);
    }
    return originalError.call(this, message, options);
  };
  
  originalToast.success = function(message: any, options?: any) {
    console.log('TOAST SUCCESS CALLED WITH:', message, typeof message);
    if (typeof message === 'object') {
      console.log('TOAST SUCCESS OBJECT:', message);
    }
    return originalSuccess.call(this, message, options);
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#1A1D23]`}>
        <Provider store={store}>
          <AuthProvider>
            <MessagingProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#2A2D35',
                    color: '#fff',
                    border: '1px solid #374151',
                  },
                  success: {
                    style: {
                      background: '#065f46',
                      border: '1px solid #10b981',
                    },
                  },
                  error: {
                    style: {
                      background: '#7f1d1d',
                      border: '1px solid #ef4444',
                    },
                  },
                }}
              />
            </MessagingProvider>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}