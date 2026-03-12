# Migration Cleanup Analysis

This document lists migrations that are **not needed** for defining the current schema or for a fresh database install. Use it to plan consolidation or baseline creation; **do not** delete migration files that have already been applied to any environment (Supabase tracks applied migrations—removing files breaks history).

---

## 1. Diagnostic only (no DDL/DML)

These files contain **only** `SELECT`, `COMMENT`, or `RAISE NOTICE`. They do not change schema or data. Safe to run anytime; not required to build current state.

| Migration | Purpose |
|-----------|---------|
| `diagnostic_shop_count.sql` | Shop count queries |
| `diagnose_shop_names.sql` | Sample shop names for debugging |
| `20250104030000_data_integrity_audit_queries.sql` | Data integrity audit SELECTs |
| `20250104080000_analyze_unknown_prefectures.sql` | Prefecture analysis SELECTs |
| `20250104100000_verify_prefecture_data.sql` | Prefecture verification SELECTs |
| `20250104110000_category_subcategory_counts.sql` | Category counts |
| `20250104120000_diagnose_subcategory_issues.sql` | Subcategory diagnostics |
| `20250104140000_diagnose_category_hierarchy.sql` | Category hierarchy check |
| `20250104180000_analyze_remaining_unknown_shops.sql` | Unknown shops analysis |
| `20250104200000_show_unknown_subcategories.sql` | Subcategory listing |
| `20250104220000_diagnose_spa_onsen_distribution.sql` | Spa/onsen distribution |
| `20250105100000_diagnose_unclaimed_shops_prefecture.sql` | Unclaimed shops prefecture |
| `20250105110000_diagnose_massages_shops.sql` | Massages category diagnostics |
| `20250105120000_debug_claim_shop_filters.sql` | Claim filter state check |
| `20250105150000_check_prefecture_duplicates.sql` | Prefecture duplicate check |
| `20251202213000_diagnostic_category_check.sql` | Category assignment check |
| `20250301_check_realtime_setup.sql` | Realtime/replica identity check |
| `20250301_quick_check_replica_identity.sql` | Replica identity status |
| `20250301_verify_customer_architecture.sql` | Customer tables structure check |
| `verify_shop_verification_tables.sql` | Verification tables existence |
| `verify_verification_documents_setup.sql` | Verification bucket/policies check |

---

## 2. Verify-only (read-only gates)

These run checks and may `RAISE EXCEPTION` on failure. No schema changes. One-time verification gates.

| Migration | Purpose |
|-----------|---------|
| `20250206_verify_canonical_customer_system.sql` | Verifies bookings have valid `customer_id` after canonical migration |

---

## 3. One-off data cleanup / backfill (already applied)

One-time data fixes, backfills, or deletes. Not needed for a **fresh** database; needed only once in history.

| Migration | Purpose |
|-----------|---------|
| `20250104000000_reassign_shops_to_subcategories_fix.sql` | Reassign shops to subcategories |
| `20250104040000_deduplicate_shops.sql` | Deduplicate shops |
| `20250104060000_recalculate_category_counts.sql` | Recalculate category counts |
| `20250104130000_assign_missing_subcategories.sql` | Assign missing subcategories |
| `20250104150000_reassign_parent_to_subcategories.sql` | Reassign parent categories |
| `20250104160000_fix_remaining_parent_categories.sql` | Fix parent categories |
| `20250104170000_categorize_unknown_shops.sql` | Categorize unknown shops |
| `20250104190000_categorize_unknown_by_subcategory.sql` | Categorize by subcategory |
| `20250104210000_final_categorize_all_unknown_shops.sql` | Final unknown shop categorization |
| `20250104230000_fix_spa_onsen_categorization.sql` | Spa/onsen category fix |
| `20250104240000_fix_take_a_leisurely_walk_category.sql` | Single category fix |
| `20250105030000_delete_manually_created_shops.sql` | Delete manually created shops |
| `20250105040000_delete_user_accounts.sql` | Delete user accounts |
| `20250105080000_comprehensive_spa_onsen_fix.sql` | Spa/onsen data fix |
| `20250105090000_reorganize_spa_onsen_into_4_subcategories.sql` | Spa/onsen reorganization |
| `20250105130000_populate_prefecture_field.sql` | Populate prefecture |
| `20250105140000_fix_prefecture_case_consistency.sql` | Prefecture case fix |
| `20250107010000_cleanup_shop_status_contradictions.sql` | Shop status cleanup |
| `20250122_convert_web_customers_to_guest.sql` | Convert web customers to guest |
| `20250122_delete_misclassified_web_customer.sql` | Delete misclassified web customer |
| `20250203_backfill_booking_user_fields.sql` | Backfill booking user fields |
| `20250220_backfill_user_identities_and_bookings.sql` | Backfill user identities |
| `20250222_cleanup_booking_type_before_fix.sql` | Cleanup before booking fix |
| `20251202210000_cleanup_old_subcategories.sql` | Delete old subcategories |
| `20251202220000_rebuild_category_system.sql` | Rebuild categories (includes DELETE) |
| `20251203000000_fix_category_count_multiplication.sql` | Fix category counts |
| `20251230004000_backfill_line_booking_customer_id.sql` | Backfill LINE booking customer_id |
| `20260101_controlled_reset_customers_bookings.sql` | Controlled reset |
| `20260103000006_move_shops_without_addresses_to_backup.sql` | Move no-address shops to backup |
| `20260105000000_fix_conversation_participants_user_ids.sql` | Fix conversation_participants (DELETE + fix) |
| `20260127000001_cleanup_customers_table_web_users.sql` | Cleanup customers table |
| `20260311000000_delete_all_unverified_shops.sql` | Delete all unverified shops (one-off) |

---

## 4. Duplicate / superseded

Same change in more than one file, or a later migration fully replaces an earlier one.

| Migration | Redundant with / notes |
|-----------|------------------------|
| `add_website_url_to_shops.sql` | Duplicate of `add_website_url_to_shops_clean.sql` (same `ADD COLUMN IF NOT EXISTS website_url`) — keep one (e.g. the `_clean` one). |
| `create_customer_ai_messages_table.sql` | Duplicate/superseded by `20251202230000_create_customer_ai_messages_table.sql` (same table; timestamped one has more policies). Prefer the timestamped file. |

---

## 5. Investigate / debug (may contain fixes)

These were written to investigate issues; some include real fixes (e.g. `CREATE OR REPLACE FUNCTION`). Treat as needed if they alter schema or functions.

| Migration | Notes |
|-----------|--------|
| `20260127000000_investigate_customer_profile_id_error.sql` | Contains fix for `auto_create_booking_conversation`; **keep** if that function is still in use. |

---

## Summary counts (approximate)

| Category | Count |
|----------|-------|
| Diagnostic only | 21 |
| Verify-only | 1 |
| One-off data cleanup / backfill | 32+ |
| Duplicate / superseded | 2 |
| **Total “not needed” for schema definition** | **56+** |

---

## Recommended approach (do not delete applied migrations)

1. **Do not remove** migration files that have already run on production or staging. Supabase records applied migrations; removing files can break `supabase db push` and history.
2. **For new environments**: Consider creating a **single baseline migration** (e.g. dump current schema from a running DB) and then adding only **new** migrations after that. Old migrations stay in the repo for history but new installs apply baseline + new.
3. **Optional**: Move “diagnostic only” and “verify-only” SQL into a `/scripts` or `/diagnostics` folder (not under `migrations/`) so they are not run as migrations, while keeping one-off and duplicate files in place until you baseline (or leave as-is for history).

If you want, the next step can be: (a) list of migrations to **keep** as “required for current schema,” or (b) a single baseline SQL file generated from `pg_dump --schema-only` (you run it once and add the result as one migration).
