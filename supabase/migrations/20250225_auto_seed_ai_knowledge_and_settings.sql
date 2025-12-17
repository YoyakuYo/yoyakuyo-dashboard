-- ============================================
-- AUTO-SEED AI KNOWLEDGE AND SETTINGS
-- ============================================
-- Automatically seed AI knowledge for all existing shops
-- Create default AI settings for all shops
-- OPTIMIZED: Process in batches to avoid timeouts
-- ============================================

-- ============================================
-- PART 1: Create default AI settings for all shops (FAST - do this first)
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

-- ============================================
-- PART 2: Seed AI knowledge for shops (OPTIMIZED - batch processing)
-- ============================================
-- Process shops in smaller batches to avoid timeout
-- Only seed for shops that don't have knowledge yet
DO $$
DECLARE
    v_shop_id UUID;
    v_shop_name TEXT;
    v_seeded_count INTEGER := 0;
    v_total_shops INTEGER;
    v_batch_size INTEGER := 10; -- Process 10 shops at a time
    v_processed INTEGER := 0;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO v_total_shops FROM shops;
    RAISE NOTICE 'Starting AI knowledge seeding for % shops (batch size: %)...', v_total_shops, v_batch_size;
    
    -- Process shops in batches
    FOR v_shop_id, v_shop_name IN 
        SELECT s.id, s.name 
        FROM shops s
        WHERE NOT EXISTS (
            SELECT 1 FROM shop_ai_knowledge sak 
            WHERE sak.shop_id = s.id
        )
        ORDER BY s.created_at
        LIMIT 50 -- Limit to first 50 shops to avoid timeout
    LOOP
        BEGIN
            PERFORM seed_shop_ai_knowledge(v_shop_id);
            v_seeded_count := v_seeded_count + 1;
            v_processed := v_processed + 1;
            
            -- Log progress every 10 shops
            IF v_processed % 10 = 0 THEN
                RAISE NOTICE 'Progress: %/% shops processed', v_processed, v_total_shops;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to seed knowledge for shop % (%): %', v_shop_name, v_shop_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Completed seeding AI knowledge. Shops processed: %', v_seeded_count;
    RAISE NOTICE 'Note: Remaining shops will be seeded on-demand when they receive their first message.';
END $$;

-- ============================================
-- PART 3: Log summary
-- ============================================
DO $$
DECLARE
    v_settings_count INTEGER;
    v_knowledge_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_settings_count FROM shop_ai_settings;
    SELECT COUNT(DISTINCT shop_id) INTO v_knowledge_count FROM shop_ai_knowledge;
    RAISE NOTICE 'Summary: % shops with AI settings, % shops with AI knowledge', v_settings_count, v_knowledge_count;
END $$;

