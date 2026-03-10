-- Delete the 3 duplicate Courouyaaa shops for yoyakuyodemo@gmail.com
-- KEEP: KEGNECO (8d3a1ee8-4dfc-4289-bcbb-9611c20bfa86)
-- DELETE: The 3 Courouyaaa shops below

-- Shop IDs to delete (Courouyaaa duplicates)
-- 5db999f6-0ca5-4b79-acd0-a56300e98d4a
-- 151131cd-4c94-48bd-b6ec-72be9a1a6bd2
-- 401c6601-260e-4560-a629-12dbd6acd35b

DO $$
DECLARE
  shops_to_delete UUID[] := ARRAY[
    '5db999f6-0ca5-4b79-acd0-a56300e98d4a'::UUID,
    '151131cd-4c94-48bd-b6ec-72be9a1a6bd2'::UUID,
    '401c6601-260e-4560-a629-12dbd6acd35b'::UUID
  ];
  deleted_count INT;
BEGIN
  -- Delete dependent data first (order matters for FK constraints)
  DELETE FROM bookings WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % bookings', deleted_count;

  DELETE FROM services WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % services', deleted_count;

  DELETE FROM shop_settings WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % shop_settings', deleted_count;

  DELETE FROM owner_profiles WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % owner_profiles', deleted_count;

  DELETE FROM waitlist_notifications WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % waitlist_notifications', deleted_count;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_claim_requests') THEN
    DELETE FROM shop_claim_requests WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_claim_requests', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_verification_requests') THEN
    DELETE FROM shop_verification_requests WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_verification_requests', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_photos') THEN
    DELETE FROM shop_photos WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_photos', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_threads') THEN
    DELETE FROM shop_threads WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_threads', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pending_bookings') THEN
    DELETE FROM pending_bookings WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % pending_bookings', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_notifications') THEN
    DELETE FROM shop_notifications WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_notifications', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    DELETE FROM conversations WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % conversations', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    DELETE FROM reviews WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % reviews', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_holidays') THEN
    DELETE FROM shop_holidays WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_holidays', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_ai_settings') THEN
    DELETE FROM shop_ai_settings WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_ai_settings', deleted_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_ai_knowledge') THEN
    DELETE FROM shop_ai_knowledge WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % shop_ai_knowledge', deleted_count;
  END IF;

  -- Finally delete the shops
  DELETE FROM shops WHERE id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % shops', deleted_count;

  RAISE NOTICE 'Done. yoyakuyodemo@gmail.com now has only KEGNECO.';
END $$;
