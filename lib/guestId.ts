// lib/guestId.ts
// Stable guest identity for "no login" users.
//
// IMPORTANT:
// - Backend expects guest identity via headers: x-guest-id (or x-booking-token).
// - Guest IDs can be either:
//   1. UUID format (e.g., "abc12345-6789-...")
//   2. "G" + UUID format (e.g., "Gabc12345-6789-...") - used by backend for booking-linked conversations
// - We store it in localStorage so guest booking + messaging persist across refreshes.

export const GUEST_ID_STORAGE_KEY = "yoyaku_yo_guest_id";
const LEGACY_KEYS = ["yoyakuyo_guest_id", "guest_id"];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Valid guest ID: either a UUID or "G" + UUID (backend format for booking-linked guests)
function isValidGuestId(value: string): boolean {
  if (!value || value.length < 36) return false;
  // Check if it's a pure UUID
  if (isUuid(value)) return true;
  // Check if it's "G" + UUID (backend format)
  if (value.startsWith('G') && isUuid(value.substring(1))) return true;
  return false;
}

export function getOrCreateGuestId(): string | null {
  if (typeof window === "undefined") return null;

  // Migration: if an older key exists and is a valid guest ID, move it to the canonical key.
  if (!window.localStorage.getItem(GUEST_ID_STORAGE_KEY)) {
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy && isValidGuestId(legacy)) {
        window.localStorage.setItem(GUEST_ID_STORAGE_KEY, legacy);
        break;
      }
    }
  }

  const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (existing && isValidGuestId(existing)) return existing;

  const newId = crypto.randomUUID();
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, newId);
  return newId;
}

export function setGuestId(id: string) {
  if (typeof window === "undefined") return;
  // Accept both UUID and "G" + UUID formats
  if (!isValidGuestId(id)) {
    console.warn('[GuestId] Invalid guest ID format, not saving:', id?.substring(0, 10) + '...');
    return;
  }
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, id);
}


