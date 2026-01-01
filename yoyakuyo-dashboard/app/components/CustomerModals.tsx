"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCustomAuth } from "@/lib/useCustomAuth";

const Modal = React.memo(
  ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    );
  }
);
Modal.displayName = "Modal";

export default function CustomerModals() {
  const router = useRouter();
  const t = useTranslations();
  const { signIn, signUp } = useCustomAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string>("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState<string>("");

  useEffect(() => {
    const openLogin = () => {
      // Always show the login modal when requested, even if a session exists.
      setShowLoginModal(true);
    };

    const openSignup = () => setShowSignupModal(true);
    if (typeof window !== "undefined") {
      window.addEventListener("openCustomerLoginModal", openLogin);
      window.addEventListener("openCustomerSignupModal", openSignup);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("openCustomerLoginModal", openLogin);
        window.removeEventListener("openCustomerSignupModal", openSignup);
      }
    };
  }, []);

  // Lock scroll while any customer modal is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const isOpen = showLoginModal || showSignupModal;
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLoginModal, showSignupModal]);

  const handleCustomerLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginMessage("");

    // IMPORTANT: Use FormData so browser autofill works even with controlled inputs.
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") || loginEmail || "");
    const password = String(fd.get("password") || loginPassword || "");

    const result = await signIn(email, password, "customer");
    if (!result.success) {
      setLoginMessage(`Error: ${result.error || "Login failed"}`);
      setLoginLoading(false);
      return;
    }

    setLoginMessage("Login successful! Redirecting...");
    setShowLoginModal(false);
    setTimeout(() => {
      router.push("/customer/home");
      router.refresh();
    }, 200);
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupMessage("");

    if (signupPassword !== signupConfirm) {
      setSignupMessage("Error: Passwords do not match");
      setSignupLoading(false);
      return;
    }

    const result = await signUp(signupEmail, signupPassword, signupName, "customer", signupPhone || undefined);
    if (!result.success) {
      setSignupMessage(`Error: ${result.error || "Signup failed"}`);
      setSignupLoading(false);
      return;
    }

    setSignupMessage("Account created! Redirecting...");
    setShowSignupModal(false);
    setTimeout(() => {
      router.push("/customer/home");
      router.refresh();
    }, 200);
  };

  return (
    <>
      <Modal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setLoginLoading(false);
        }}
      >
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Customer Login</h2>
        <p className="text-sm text-gray-600 text-center mb-6">Sign in to your customer account</p>

        <form onSubmit={handleCustomerLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
            <input
              id="customer-login-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
            <input
              id="customer-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end -mt-2">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              {t("forgotPassword") || "Forgot your password?"}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loginLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {loginMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm text-center ${
              loginMessage.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {loginMessage}
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => {
                setShowLoginModal(false);
                setShowSignupModal(true);
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </Modal>

      <Modal
        isOpen={showSignupModal}
        onClose={() => {
          setShowSignupModal(false);
          setSignupLoading(false);
        }}
      >
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Create Customer Account</h2>
        <p className="text-sm text-gray-600 text-center mb-6">Sign up to book appointments and save favorites</p>

        <form onSubmit={handleCustomerSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Name</label>
            <input
              id="customer-signup-name"
              name="name"
              type="text"
              autoComplete="name"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
            <input
              id="customer-signup-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
            <input
              id="customer-signup-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Confirm Password</label>
            <input
              id="customer-signup-confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Phone (Optional)</label>
            <input
              id="customer-signup-phone"
              name="tel"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+81 90-1234-5678"
            />
          </div>

          <button
            type="submit"
            disabled={signupLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {signupLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {signupMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm text-center ${
              signupMessage.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {signupMessage}
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => {
                setShowSignupModal(false);
                setShowLoginModal(true);
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Login
            </button>
          </p>
        </div>
      </Modal>
    </>
  );
}


