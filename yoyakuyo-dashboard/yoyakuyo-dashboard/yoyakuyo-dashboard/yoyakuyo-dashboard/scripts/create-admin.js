// Script to create or update an admin account
// Usage: node scripts/create-admin.js

const crypto = require('crypto');

// Password hashing function (matches the one in yoyakuyo-api/src/utils/password.ts)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Admin credentials
const adminEmail = 'sowoumar45@gmail.com';
const adminPassword = 'Sowbarcelone4545';
const adminName = 'Admin User';

// Generate password hash
const passwordHash = hashPassword(adminPassword);

console.log('Admin Account Setup SQL:');
console.log('========================\n');

// SQL to create or update admin account
const sql = `
-- Check if owner exists, if not create, if exists update role to admin
DO $$
DECLARE
  owner_id UUID;
BEGIN
  -- Check if owner exists
  SELECT id INTO owner_id
  FROM owners
  WHERE email = '${adminEmail.toLowerCase().trim()}';
  
  IF owner_id IS NULL THEN
    -- Create new owner with admin role
    INSERT INTO owners (email, password_hash, name, role, created_at, updated_at)
    VALUES (
      '${adminEmail.toLowerCase().trim()}',
      '${passwordHash}',
      '${adminName}',
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
      password_hash = '${passwordHash}',
      name = COALESCE(name, '${adminName}'),
      updated_at = NOW()
    WHERE id = owner_id;
    
    RAISE NOTICE 'Admin account updated for ID: %', owner_id;
  END IF;
END $$;

-- Verify the admin account
SELECT id, email, name, role, created_at
FROM owners
WHERE email = '${adminEmail.toLowerCase().trim()}';
`;

console.log(sql);
console.log('\n========================');
console.log('Copy the SQL above and run it in your Supabase SQL editor.');
console.log(`Admin email: ${adminEmail}`);
console.log(`Admin password: ${adminPassword}`);

