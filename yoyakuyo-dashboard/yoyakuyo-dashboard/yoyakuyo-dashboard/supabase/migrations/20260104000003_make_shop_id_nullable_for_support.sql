-- Migration: Make shop_id nullable for admin support tickets
-- Admin support tickets should have shop_id = null (no shop association)

-- Step 1: Make shop_id nullable
DO $$
BEGIN
    -- Check if shop_id is currently NOT NULL
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND column_name = 'shop_id'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop the foreign key constraint first (if it exists)
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_schema = 'public'
            AND table_name = 'conversations'
            AND constraint_name LIKE '%shop_id%'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            -- Find and drop the foreign key constraint
            EXECUTE (
                SELECT 'ALTER TABLE conversations DROP CONSTRAINT ' || constraint_name
                FROM information_schema.table_constraints
                WHERE table_schema = 'public'
                AND table_name = 'conversations'
                AND constraint_name LIKE '%shop_id%'
                AND constraint_type = 'FOREIGN KEY'
                LIMIT 1
            );
            RAISE NOTICE 'Dropped existing shop_id foreign key constraint';
        END IF;

        -- Make shop_id nullable
        ALTER TABLE conversations 
        ALTER COLUMN shop_id DROP NOT NULL;
        
        RAISE NOTICE 'Made shop_id nullable in conversations table';
    ELSE
        RAISE NOTICE 'shop_id is already nullable';
    END IF;

    -- Re-add the foreign key constraint with ON DELETE SET NULL
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public'
        AND table_name = 'conversations'
        AND constraint_name = 'conversations_shop_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE conversations
        ADD CONSTRAINT conversations_shop_id_fkey
        FOREIGN KEY (shop_id) 
        REFERENCES shops(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added conversations_shop_id_fkey foreign key constraint';
    ELSE
        RAISE NOTICE 'conversations_shop_id_fkey foreign key constraint already exists';
    END IF;
END $$;

-- Step 2: Update existing admin support conversations to have null shop_id
-- Admin support conversations are identified by:
-- 1. is_support_ticket = true
-- 2. Has admin messages (source='ai', source_id='admin')
-- 3. OR no owner messages (indicating admin support, not owner support)

WITH admin_support_conversations AS (
  SELECT DISTINCT c.id
  FROM conversations c
  INNER JOIN messages m ON m.conversation_id = c.id
  INNER JOIN participants p ON p.id = m.sender_id
  WHERE c.is_support_ticket = true
    AND c.shop_id IS NOT NULL
    AND p.source = 'ai'
    AND p.source_id = 'admin'
)
UPDATE conversations
SET shop_id = NULL
WHERE id IN (SELECT id FROM admin_support_conversations);

-- Also fix support tickets that don't have owner messages (likely admin support)
UPDATE conversations
SET shop_id = NULL
WHERE is_support_ticket = true
  AND shop_id IS NOT NULL
  AND id NOT IN (
    -- Exclude conversations that have owner messages (these are owner support, not admin)
    SELECT DISTINCT c.id
    FROM conversations c
    INNER JOIN messages m ON m.conversation_id = c.id
    INNER JOIN participants p ON p.id = m.sender_id
    WHERE c.is_support_ticket = true
      AND p.source = 'owner'
  );

-- Verify the changes
SELECT 
  COUNT(*) FILTER (WHERE shop_id IS NULL) as admin_support_count,
  COUNT(*) FILTER (WHERE shop_id IS NOT NULL) as owner_support_count,
  COUNT(*) as total_support_tickets
FROM conversations
WHERE is_support_ticket = true;

