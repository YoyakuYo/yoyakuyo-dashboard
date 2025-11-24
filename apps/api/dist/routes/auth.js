"use strict";
// apps/api/src/routes/auth.ts
// Authentication routes for owner signup
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
// POST /auth/signup-owner - Create user record in public.users and optional shop
// Note: User is already created in Supabase Auth via frontend auth.signUp()
// This endpoint just creates the public.users record and shop
router.post("/signup-owner", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { user_id, name, email, shop_name } = req.body;
        // Validate required fields
        if (!user_id || !name || !email) {
            return res.status(400).json({
                error: 'user_id, name, and email are required'
            });
        }
        if (!supabase_1.supabaseAdmin) {
            return res.status(500).json({
                error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required'
            });
        }
        // Step 1: Ensure user record exists in public.users table
        // Handle both ID and email conflicts (email has unique constraint)
        console.log('Ensuring user record exists in public.users for:', user_id, email);
        // First, check if user exists by ID
        const { data: existingById, error: checkByIdError } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('id', user_id)
            .maybeSingle();
        if (checkByIdError && checkByIdError.code !== 'PGRST116') {
            console.error('Error checking user by ID:', checkByIdError);
            return res.status(500).json({
                error: `Failed to check user: ${checkByIdError.message}`
            });
        }
        // If user exists by ID, verify email matches (or update if needed)
        if (existingById) {
            if (existingById.email !== email) {
                // Update email if different
                console.log('Updating user email from', existingById.email, 'to', email);
                const { error: updateError } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .update({ email: email, name: name })
                    .eq('id', user_id);
                if (updateError) {
                    console.error('Error updating user:', updateError);
                    return res.status(500).json({
                        error: `Failed to update user record: ${updateError.message}`
                    });
                }
            }
            else {
                // Just update name if email matches
                const { error: updateError } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .update({ name: name })
                    .eq('id', user_id);
                if (updateError) {
                    console.warn('Warning: Could not update user name:', updateError);
                }
            }
            console.log('✅ User record exists and verified:', existingById.id);
        }
        else {
            // User doesn't exist by ID, check if email is already used
            const { data: existingByEmail, error: checkByEmailError } = yield supabase_1.supabaseAdmin
                .from('users')
                .select('id, email')
                .eq('email', email)
                .maybeSingle();
            if (checkByEmailError && checkByEmailError.code !== 'PGRST116') {
                console.error('Error checking user by email:', checkByEmailError);
                return res.status(500).json({
                    error: `Failed to check user: ${checkByEmailError.message}`
                });
            }
            if (existingByEmail) {
                // Email exists but with different user_id
                // Since user was just created in auth.users, we should use the new user_id
                // The old record is likely orphaned (auth.users record was deleted/incomplete)
                // Delete the old orphaned record and create new one with correct user_id
                console.log('Email exists with different user_id. Replacing orphaned record:', {
                    old_user_id: existingByEmail.id,
                    new_user_id: user_id,
                    email: email
                });
                // Delete old orphaned record
                const { error: deleteError } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .delete()
                    .eq('email', email);
                if (deleteError) {
                    console.error('Error deleting old user record:', deleteError);
                    return res.status(500).json({
                        error: `Failed to clean up old user record: ${deleteError.message}`
                    });
                }
                // Create new record with correct user_id
                console.log('Creating new user record with correct user_id:', user_id);
                const { data: newUser, error: createError } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .insert([{
                        id: user_id,
                        name: name,
                        email: email,
                    }])
                    .select('id')
                    .single();
                if (createError) {
                    console.error('Error creating user record after cleanup:', createError);
                    return res.status(500).json({
                        error: `Failed to create user record: ${createError.message}`
                    });
                }
                console.log('✅ User record recreated with correct user_id:', newUser === null || newUser === void 0 ? void 0 : newUser.id);
            }
            else {
                // Email doesn't exist, create new user
                console.log('Creating new user record:', user_id);
                const { data: newUser, error: createError } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .insert([
                    {
                        id: user_id,
                        name: name,
                        email: email,
                    }
                ])
                    .select('id')
                    .single();
                if (createError) {
                    console.error('Error creating user record:', createError);
                    // Check if it's a duplicate key error (race condition)
                    if (createError.code === '23505') {
                        // Duplicate key - user was created by another request, verify it exists
                        console.log('Duplicate key error (race condition), verifying user exists...');
                        const { data: verifyData, error: verifyError } = yield supabase_1.supabaseAdmin
                            .from('users')
                            .select('id')
                            .eq('id', user_id)
                            .maybeSingle();
                        if (verifyError || !verifyData) {
                            return res.status(500).json({
                                error: `Failed to create user record: ${createError.message}`
                            });
                        }
                        console.log('✅ User record verified after race condition');
                    }
                    else {
                        return res.status(500).json({
                            error: `Failed to create user record: ${createError.message}`
                        });
                    }
                }
                else {
                    console.log('✅ User record created successfully:', newUser === null || newUser === void 0 ? void 0 : newUser.id);
                }
            }
        }
        // Final verification: ensure user definitely exists before proceeding
        const { data: finalVerify, error: finalError } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', user_id)
            .maybeSingle();
        if (finalError || !finalVerify) {
            console.error('CRITICAL: User record not found after creation attempt:', finalError);
            return res.status(500).json({
                error: 'User record could not be created or verified. Please try again.'
            });
        }
        console.log('✅ User record confirmed to exist:', finalVerify.id);
        // Step 2: Create shop if shop_name provided
        let shopId = null;
        if (shop_name && shop_name.trim()) {
            console.log('Creating shop:', shop_name);
            // At this point, user should exist (either we created it or it already existed)
            // If there was an error creating user (except duplicate), we would have returned already
            // So we can proceed with shop creation - the foreign key constraint will catch any issues
            const { data: shopData, error: shopError } = yield supabase_1.supabaseAdmin
                .from('shops')
                .insert([
                {
                    name: shop_name.trim(),
                    owner_user_id: user_id,
                    claim_status: 'approved',
                    claimed_at: new Date().toISOString(),
                    address: null,
                    phone: null,
                    email: email,
                }
            ])
                .select('id')
                .single();
            if (shopError) {
                console.error('Error creating shop:', shopError);
                // Check if it's a foreign key constraint error
                if (shopError.code === '23503' || ((_a = shopError.message) === null || _a === void 0 ? void 0 : _a.includes('foreign key constraint'))) {
                    // Double-check user exists
                    const { data: emergencyCheck, error: emergencyError } = yield supabase_1.supabaseAdmin
                        .from('users')
                        .select('id')
                        .eq('id', user_id)
                        .maybeSingle();
                    if (emergencyError || !emergencyCheck) {
                        console.error('EMERGENCY: User record missing when creating shop!', {
                            user_id,
                            emergencyError,
                            shopError: shopError.message
                        });
                        return res.status(500).json({
                            error: 'User record is missing. Please contact support or try signing up again.'
                        });
                    }
                    else {
                        console.error('User exists but shop creation failed:', shopError);
                        return res.status(500).json({
                            error: `Failed to create shop: ${shopError.message}`
                        });
                    }
                }
                return res.status(500).json({
                    error: `Failed to create shop: ${shopError.message}`
                });
            }
            else {
                shopId = shopData === null || shopData === void 0 ? void 0 : shopData.id;
                console.log('✅ Shop created successfully:', shopId);
            }
        }
        return res.status(201).json({
            user_id: user_id,
            shop_id: shopId,
            message: 'Owner account setup completed successfully',
        });
    }
    catch (e) {
        console.error('Error during owner signup setup:', e);
        return res.status(500).json({
            error: e.message || 'An unexpected error occurred during signup setup'
        });
    }
}));
exports.default = router;
