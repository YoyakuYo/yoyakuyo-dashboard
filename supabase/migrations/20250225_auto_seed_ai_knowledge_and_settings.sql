-- ============================================
-- AUTO-SEED AI KNOWLEDGE AND SETTINGS
-- ============================================
-- Automatically seed AI knowledge for all existing shops
-- Create default AI settings for all shops
-- ============================================

-- ============================================
-- PART 1: Seed AI knowledge for all existing shops
-- ============================================
DO $$
DECLARE
    v_shop shops%ROWTYPE;
    v_seeded_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting AI knowledge seeding for all shops...';
    
    FOR v_shop IN SELECT * FROM shops
    LOOP
        BEGIN
            PERFORM seed_shop_ai_knowledge(v_shop.id);
            v_seeded_count := v_seeded_count + 1;
            RAISE NOTICE 'Seeded AI knowledge for shop: % (%)', v_shop.name, v_shop.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to seed knowledge for shop % (%): %', v_shop.name, v_shop.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Completed seeding AI knowledge. Total shops processed: %', v_seeded_count;
END $$;

-- ============================================
-- PART 2: Create default AI settings for all shops
-- ============================================
INSERT INTO shop_ai_settings (shop_id, enabled, auto_reply_enabled, max_auto_replies_per_conversation, handoff_keywords)
SELECT 
    id,
    true, -- enabled by default
    true, -- auto_reply_enabled by default
    3, -- max_auto_replies_per_conversation default
    ARRAY['speak to human', 'talk to owner', 'manager', 'human', 'real person']::TEXT[] -- default handoff keywords
FROM shops
WHERE id NOT IN (SELECT shop_id FROM shop_ai_settings WHERE shop_id IS NOT NULL)
ON CONFLICT (shop_id) DO NOTHING;

-- Log how many settings were created
DO $$
DECLARE
    v_settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_settings_count FROM shop_ai_settings;
    RAISE NOTICE 'Created default AI settings. Total shops with AI settings: %', v_settings_count;
END $$;

