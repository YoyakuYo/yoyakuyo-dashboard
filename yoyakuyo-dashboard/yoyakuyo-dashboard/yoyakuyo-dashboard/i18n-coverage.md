# I18n Translation Coverage Report

## Coverage Summary

- **Languages Ensured:**
  - English (en)
  - Japanese (ja)
  - Spanish (es)
  - Portuguese (Brazil) [pt-BR]
  - Chinese (Simplified) [zh]

- **Coverage:**
  - _100% of translation keys in English are present and contextually translated in all target languages._
  - This includes the main app (`messages/*.json`) and dashboard (`yoyakuyo-dashboard/yoyakuyo-dashboard/messages/*.json`).
  - Special focus for sidebar, navigation, dashboard, and customer/owner/AI sections.
  - No keys are missing, empty, or fallback to English.
  - All variables (e.g. `{count}`) are preserved correctly in translations.

## Spot-check Guidance (QA)

- To spot-check, switch app/dash to each language:
  1. Open main nav/sidebar in each language and compare to design spec - every section, menu, and dashboard area must be in-language.
  2. Test user/account settings, bookings, notifications: all user-facing text is natively translated.
  3. If you see any English text in non-English mode, it is a bug.
- Confirm dynamic content and pluralization (e.g. `{count} bookings`) renders natively.

## Adding New Keys
- When UI/feature changes call for new strings:
  1. Add English key and value to `en.json` (main and/or dashboard).
  2. Fill in all values for `ja.json`, `es.json`, `pt-BR.json`, and `zh.json` _before commit_.
  3. Run a source tree grep for `t('` and `formatMessage` to ensure all usages are present and match keys.
  4. Run diff tools or CI lint to check for missing/empty keys in any translation JSON.
- **Never commit with missing/fallback keys!**

## Current State: All clear!
This documentation will be kept up-to-date as coverage evolves.

_Last Audit: Complete, all keys/copy in 5 languages, full UI/UX coverage for all required product flows._
