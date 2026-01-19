import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
const router = Router();

// GET /timeslots
router.get('/', async (req: Request, res: Response) => {
    try {
        // Get user_id from header (x-user-id) for filtering
        const userId = req.headers['x-user-id'] as string;
        
        let query = supabase.from('availability').select('*');
        
        // If user_id provided, filter by staff from shops owned by user
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
            
            // Get staff IDs from user's shops
            const { data: userStaff, error: staffError } = await supabase
                .from('staff')
                .select('id')
                .in('shop_id', shopIds);
            
            if (staffError) {
                console.error('Error fetching user staff:', staffError);
                return res.status(200).json([]);
            }
            
            if (!userStaff || userStaff.length === 0) {
                // User has no staff, return empty array
                return res.status(200).json([]);
            }
            
            const staffIds = userStaff.map(staff => staff.id);
            query = query.in('staff_id', staffIds);
        }
        
        const { data: timeslots, error } = await query;

        if (error) {
            console.error('Error fetching timeslots:', error);
            // Return empty array instead of error object to prevent frontend .map() errors
            return res.status(200).json([]);
        }

        // Ensure we always return an array, even if data is null/undefined
        return res.json(Array.isArray(timeslots) ? timeslots : []);
    } catch (error: any) {
        console.error('Error during fetching timeslots:', error);
        // Return empty array instead of error object
        return res.status(200).json([]);
    }
});

// POST /timeslots
router.post('/', async (req: Request, res: Response) => {
    try {
        const { staff_id, start_time, end_time } = req.body;

        // Extract time part (HH:MM) from ISO datetime strings
        // Frontend sends "2025-11-16T08:00:00.000Z", database expects "08:00"
        let sanitizedStartTime = start_time;
        let sanitizedEndTime = end_time;

        if (start_time) {
            try {
                // Convert ISO datetime to TIME format (HH:MM)
                sanitizedStartTime = new Date(start_time).toISOString().substring(11, 16);
            } catch (e) {
                // If conversion fails, use original value (might already be in correct format)
                console.warn('Failed to convert start_time, using original:', start_time);
            }
        }

        if (end_time) {
            try {
                // Convert ISO datetime to TIME format (HH:MM)
                sanitizedEndTime = new Date(end_time).toISOString().substring(11, 16);
            } catch (e) {
                // If conversion fails, use original value (might already be in correct format)
                console.warn('Failed to convert end_time, using original:', end_time);
            }
        }

        const { data: newTimeslot, error } = await supabase
            .from('availability')
            .insert([
                {
                    staff_id,
                    start_time: sanitizedStartTime,
                    end_time: sanitizedEndTime,
                    day_of_week: new Date(start_time).getDay(), // Get day of week from start_time
                }
            ])
            .select('*');

        if (error) {
            console.error('Error creating timeslot:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(newTimeslot?.[0] ?? { message: 'Timeslot created' });
    } catch (error: any) {
        console.error('Error during timeslot creation:', error);
        return res.status(500).json({ error: error.message });
    }
});

// GET /timeslots/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: timeslot, error: timeslotError } = await supabase
            .from('availability')
            .select('*')
            .eq('id', id)
            .single();

        if (timeslotError) {
            console.error('Error fetching timeslot:', timeslotError);
            return res.status(404).json({ error: timeslotError.message });
        }

        return res.json(timeslot);
    } catch (error: any) {
        console.error('Error during timeslot retrieval:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;