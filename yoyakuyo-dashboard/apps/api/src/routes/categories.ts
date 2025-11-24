import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";

const router = Router();

// Use service role client if available (bypasses RLS), otherwise use anon client
const dbClient = supabaseAdmin || supabase;

// GET /categories - Get all categories
router.get("/", async (req: Request, res: Response) => {
    try {
        const { data, error } = await dbClient
            .from("categories")
            .select("*")
            .order("name", { ascending: true });
        
        if (error) {
            console.error('Error fetching categories:', error);
            return res.status(500).json({ error: error.message });
        }
        
        return res.json(Array.isArray(data) ? data : []);
    } catch (e: any) {
        console.error('Error during fetching categories:', e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /categories/stats - Get shop counts for each category
router.get("/stats", async (req: Request, res: Response) => {
    try {
        console.log('GET /categories/stats - Fetching category statistics');
        
        // First, get all categories
        const { data: categories, error: categoriesError } = await dbClient
            .from("categories")
            .select("id, name")
            .order("name", { ascending: true });
        
        if (categoriesError) {
            console.error('Error fetching categories:', categoriesError);
            return res.status(500).json({ error: categoriesError.message });
        }
        
        if (!Array.isArray(categories)) {
            console.warn('Categories is not an array:', categories);
            return res.json({});
        }
        
        console.log(`Found ${categories.length} categories`);
        
        // Count shops for each category
        const stats: Record<string, number> = {};
        
        // Count shops with no category (Unknown) - exclude hidden shops
        let unknownQuery = dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true })
            .is("category_id", null);
        
        // Exclude shops with claim_status = 'hidden' for public stats
        unknownQuery = unknownQuery.or("claim_status.is.null,claim_status.neq.hidden");
        
        const { count: unknownCount, error: unknownError } = await unknownQuery;
        
        if (!unknownError) {
            // Find Unknown category
            const unknownCategory = categories.find(c => c.name === 'Unknown');
            if (unknownCategory) {
                stats[unknownCategory.id] = unknownCount || 0;
                console.log(`Unknown category count: ${unknownCount || 0}`);
            }
        } else {
            console.error('Error counting unknown shops:', unknownError);
        }
        
        // Count shops for each category
        for (const category of categories) {
            if (category.name === 'Unknown') {
                // Already counted above
                continue;
            }
            
            // Exclude shops with claim_status = 'hidden' for public stats
            const { count, error } = await dbClient
                .from("shops")
                .select("*", { count: 'exact', head: true })
                .eq("category_id", category.id)
                .or("claim_status.is.null,claim_status.neq.hidden");
            
            if (error) {
                console.error(`Error counting shops for category ${category.name} (${category.id}):`, error);
                stats[category.id] = 0;
            } else {
                stats[category.id] = count || 0;
                console.log(`Category ${category.name} (${category.id}): ${count || 0} shops`);
            }
        }
        
        // Also add total count - exclude hidden shops
        const { count: totalCount, error: totalError } = await dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true })
            .or("claim_status.is.null,claim_status.neq.hidden");
        
        if (!totalError) {
            stats['all'] = totalCount || 0;
            console.log(`Total shops: ${totalCount || 0}`);
        } else {
            console.error('Error counting total shops:', totalError);
        }
        
        console.log('Category stats result:', stats);
        return res.json(stats);
    } catch (e: any) {
        console.error('Error during fetching category stats:', e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /categories/public-stats - Get shop counts by category field (for public shops page)
router.get("/public-stats", async (req: Request, res: Response) => {
    try {
        console.log('GET /categories/public-stats - Fetching category statistics by category field');
        
        // Category mapping: database values to display labels
        const categoryLabels: Record<string, string> = {
            'barber_shop': 'Barber Shop',
            'hair_salon': 'Hair Salon',
            'general_salon': 'General Salon',
            'nail_salon': 'Nail Salon',
            'eyelashes': 'Eyelashes',
            'spa_massage': 'Spa & Massage',
            'other': 'Other',
        };
        
        const stats: Record<string, number> = {};
        
        // Count shops for each category value
        for (const [dbValue, label] of Object.entries(categoryLabels)) {
            const { count, error } = await dbClient
                .from("shops")
                .select("*", { count: 'exact', head: true })
                .eq("category", dbValue);
            
            if (error) {
                console.error(`Error counting shops for category ${dbValue}:`, error);
                stats[label] = 0;
            } else {
                stats[label] = count || 0;
                console.log(`Category ${label} (${dbValue}): ${count || 0} shops`);
            }
        }
        
        // Also count shops with null/empty category
        const { count: nullCount, error: nullError } = await dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true })
            .or("category.is.null,category.eq.");
        
        if (!nullError) {
            stats['Other'] = (stats['Other'] || 0) + (nullCount || 0);
        }
        
        // Total count
        const { count: totalCount, error: totalError } = await dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true });
        
        if (!totalError) {
            stats['all'] = totalCount || 0;
        }
        
        console.log('Public category stats result:', stats);
        return res.json(stats);
    } catch (e: any) {
        console.error('Error during fetching public category stats:', e);
        return res.status(500).json({ error: e.message });
    }
});

export default router;

