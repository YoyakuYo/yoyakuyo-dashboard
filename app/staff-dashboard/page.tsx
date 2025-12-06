"use client";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import StaffSetupButton from "../components/StaffSetupButton";
