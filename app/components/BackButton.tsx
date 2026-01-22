"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface BackButtonProps {
  href?: string;
  text?: string;
  className?: string;
}

export default function BackButton({
  href,
  text = "Back",
  className = ""
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      // If href is provided, navigate to specific page
      router.push(href);
    } else {
      // Otherwise, go back in history
      router.back();
    }
  };

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors ${className}`}
      >
        <span className="text-lg">🔙</span>
        <span className="font-medium">{text}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors ${className}`}
    >
      <span className="text-lg">🔙</span>
      <span className="font-medium">{text}</span>
    </button>
  );
}