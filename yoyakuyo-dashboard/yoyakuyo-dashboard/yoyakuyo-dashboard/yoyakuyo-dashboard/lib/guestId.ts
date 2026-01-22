// lib/guestId.ts
// Stable guest identity for "no login" users.
//
// IMPORTANT:
// - Backend expects guest identity via headers: x-guest-id (or x-booking-token).
// - The value should be a UUID. Non-UUID values may cause new IDs to be issued.
// - We store it in localStorage so guest booking + messaging persist across refreshes.

export const GUEST_ID_STORAGE_KEY = "yoyaku_yo_guest_id";
const LEGACY_KEYS = ["yoyakuyo_guest_id", "guest_id"];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function getOrCreateGuestId(): string | null {
  if (typeof window === "undefined") return null;

  // Migration: if an older key exists and is a UUID, move it to the canonical key.
  if (!window.localStorage.getItem(GUEST_ID_STORAGE_KEY)) {
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy && isUuid(legacy)) {
        window.localStorage.setItem(GUEST_ID_STORAGE_KEY, legacy);
        break;
      }
    }
  }

  const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (existing && isUuid(existing)) return existing;

  const newId = crypto.randomUUID();
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, newId);
  return newId;
}

export function setGuestId(id: string) {
  if (typeof window === "undefined") return;
  if (!isUuid(id)) return;
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, id);
}


