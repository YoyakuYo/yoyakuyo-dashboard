"use client";

import { ReactNode } from "react";
import StaffAuthGuard from "./components/StaffAuthGuard";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StaffAuthGuard>
      {children}
    </StaffAuthGuard>
  );
}

