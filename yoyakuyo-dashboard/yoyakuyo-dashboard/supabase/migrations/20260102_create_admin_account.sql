-- Create or update admin account
-- Email: sowoumar45@gmail.com
-- Password: Sowbarcelone4545

DO $$
DECLARE
  owner_id UUID;
BEGIN
  -- Check if owner exists
  SELECT id INTO owner_id
  FROM owners
  WHERE email = 'sowoumar45@gmail.com';
  
  IF owner_id IS NULL THEN
    -- Create new owner with admin role
    INSERT INTO owners (email, password_hash, name, role, created_at, updated_at)
    VALUES (
      'sowoumar45@gmail.com',
      '07b484b4ac17ddb29655846aed615ccd:fcf8b052b314c143b24e9361190e5dbba2614c4a2e72521cc88584fa90f675b99d1aca8ab550b002ec1b6e5ef05f745ddade4eabbe8776ca9435f4273446e8d8',
      'Admin User',
      'admin',
      NOW(),
      NOW()
    )
    RETURNING id INTO owner_id;
    
    RAISE NOTICE 'Admin account created with ID: %', owner_id;
  ELSE
    -- Update existing owner to admin role
    UPDATE owners
    SET 
      role = 'admin',
      password_hash = '07b484b4ac17ddb29655846aed615ccd:fcf8b052b314c143b24e9361190e5dbba2614c4a2e72521cc88584fa90f675b99d1aca8ab550b002ec1b6e5ef05f745ddade4eabbe8776ca9435f4273446e8d8',
      name = COALESCE(name, 'Admin User'),
      updated_at = NOW()
    WHERE id = owner_id;
    
    RAISE NOTICE 'Admin account updated for ID: %', owner_id;
  END IF;
END $$;

-- Verify the admin account
SELECT id, email, name, role, created_at
FROM owners
WHERE email = 'sowoumar45@gmail.com';

