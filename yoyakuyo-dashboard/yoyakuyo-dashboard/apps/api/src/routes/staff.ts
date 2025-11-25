import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
const router = Router();

// GET /staff
router.get('/', async (req: Request, res: Response) => {
    try {
        // Get user_id from header (x-user-id) for filtering
        const userId = req.headers['x-user-id'] as string;
        
        let query = supabase.from('staff').select('*');
        
        // If user_id provided, filter by shops owned by user
        if (userId) {
            // First get shop IDs owned by this user
            const { data: userShops, error: shopsError } = await supabase
                .from('shops')
                .select('id')
                .eq('owner_user_id', userId);
            
            if (shopsError) {
                console.error('Error fetching user shops:', shopsError);
                return res.status(200).json([]);
            }
            
            if (!userShops || userShops.length === 0) {
                // User owns no shops, return empty array
                return res.status(200).json([]);
            }
            
            const shopIds = userShops.map(shop => shop.id);
            query = query.in('shop_id', shopIds);
        }
        
        const { data: staff, error } = await query;

        if (error) {
            console.error('Error fetching staff:', error);
            // Return empty array to prevent frontend .map() errors
            return res.status(200).json([]);
        }

        // Ensure we always return an array
        return res.json(Array.isArray(staff) ? staff : []);
    } catch (error: any) {
        console.error('Error during fetching staff:', error);
        // Return empty array to prevent frontend crashes
        return res.status(200).json([]);
    }
});

// POST /staff
router.post('/', async (req: Request, res: Response) => {
    try {
        const { shop_id, first_name, last_name, phone, email } = req.body;
        const userId = req.headers['x-user-id'] as string;

        // Verify user owns the shop
        if (userId && shop_id) {
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .select('owner_user_id')
                .eq('id', shop_id)
                .single();
            
            if (shopError || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'You do not own this shop' });
            }
        }

        const { data: newStaff, error } = await supabase
            .from('staff')
            .insert([
                {
                    shop_id,
                    first_name,
                    last_name,
                    phone,
                    email,
                }
            ])
            .select('*');

        if (error) {
            console.error('Error creating staff:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(newStaff?.[0] ?? { message: 'Staff created' });

    } catch (error: any) {
        console.error('Error during staff creation:', error);
        return res.status(500).json({ error: error.message });
    }
});

// GET /staff/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('id', id)
            .single();

        if (staffError) {
            console.error('Error fetching staff:', staffError);
            return res.status(404).json({ error: staffError.message });
        }

        return res.json(staff);
    } catch (error: any) {
        console.error('Error during staff retrieval:', error);
        return res.status(500).json({ error: error.message });
    }
});

// PUT /staff/:id - Update a staff member
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const staffId = req.params.id;
        const { shop_id, first_name, last_name, phone, email } = req.body;
        const userId = req.headers['x-user-id'] as string;

        // First, get the existing staff to check ownership
        const { data: existingStaff, error: fetchError } = await supabase
            .from('staff')
            .select('shop_id')
            .eq('id', staffId)
            .single();

        if (fetchError || !existingStaff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Verify user owns the shop that this staff belongs to
        if (userId) {
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .select('owner_user_id')
                .eq('id', existingStaff.shop_id)
                .single();
            
            if (shopError || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'You do not own this shop' });
            }

            // If shop_id is being changed, verify user owns the new shop too
            if (shop_id && shop_id !== existingStaff.shop_id) {
                const { data: newShop, error: newShopError } = await supabase
                    .from('shops')
                    .select('owner_user_id')
                    .eq('id', shop_id)
                    .single();
                
                if (newShopError || !newShop) {
                    return res.status(404).json({ error: 'New shop not found' });
                }
                
                if (newShop.owner_user_id !== userId) {
                    return res.status(403).json({ error: 'You do not own the new shop' });
                }
            }
        }

        // Build update object (only include fields that are provided)
        const updateData: any = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (shop_id !== undefined) updateData.shop_id = shop_id;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data, error } = await supabase
            .from('staff')
            .update(updateData)
            .eq('id', staffId)
            .select()
            .single();

        if (error) {
            console.error('Error updating staff:', error);
            return res.status(400).json({ error: error.message });
        }

        return res.json(data);
    } catch (err: any) {
        console.error('Server error updating staff:', err);
        return res.status(500).json({ error: 'Server error updating staff' });
    }
});

// DELETE /staff/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const staffId = req.params.id;
        const userId = req.headers['x-user-id'] as string;

        // First, get the existing staff to check ownership
        const { data: existingStaff, error: fetchError } = await supabase
            .from('staff')
            .select('shop_id')
            .eq('id', staffId)
            .single();

        if (fetchError || !existingStaff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Verify user owns the shop that this staff belongs to
        if (userId) {
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .select('owner_user_id')
                .eq('id', existingStaff.shop_id)
                .single();
            
            if (shopError || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'You do not own this shop' });
            }
        }

        const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', staffId);

        if (error) {
            console.error('Error deleting staff:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: 'Staff deleted successfully' });
    } catch (err: any) {
        console.error('Server error deleting staff:', err);
        return res.status(500).json({ error: 'Server error deleting staff' });
    }
});

export default router;