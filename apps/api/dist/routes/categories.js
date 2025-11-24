"use strict";
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
// Use service role client if available (bypasses RLS), otherwise use anon client
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
// GET /categories - Get all categories
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, error } = yield dbClient
            .from("categories")
            .select("*")
            .order("name", { ascending: true });
        if (error) {
            console.error('Error fetching categories:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.json(Array.isArray(data) ? data : []);
    }
    catch (e) {
        console.error('Error during fetching categories:', e);
        return res.status(500).json({ error: e.message });
    }
}));
// GET /categories/stats - Get shop counts for each category
router.get("/stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('GET /categories/stats - Fetching category statistics');
        // First, get all categories
        const { data: categories, error: categoriesError } = yield dbClient
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
        const stats = {};
        // Count shops with no category (Unknown) - exclude hidden shops
        let unknownQuery = dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true })
            .is("category_id", null);
        // Exclude shops with claim_status = 'hidden' for public stats
        unknownQuery = unknownQuery.or("claim_status.is.null,claim_status.neq.hidden");
        const { count: unknownCount, error: unknownError } = yield unknownQuery;
        if (!unknownError) {
            // Find Unknown category
            const unknownCategory = categories.find(c => c.name === 'Unknown');
            if (unknownCategory) {
                stats[unknownCategory.id] = unknownCount || 0;
                console.log(`Unknown category count: ${unknownCount || 0}`);
            }
        }
        else {
            console.error('Error counting unknown shops:', unknownError);
        }
        // Count shops for each category
        for (const category of categories) {
            if (category.name === 'Unknown') {
                // Already counted above
                continue;
            }
            // Exclude shops with claim_status = 'hidden' for public stats
            const { count, error } = yield dbClient
                .from("shops")
                .select("*", { count: 'exact', head: true })
                .eq("category_id", category.id)
                .or("claim_status.is.null,claim_status.neq.hidden");
            if (error) {
                console.error(`Error counting shops for category ${category.name} (${category.id}):`, error);
                stats[category.id] = 0;
            }
            else {
                stats[category.id] = count || 0;
                console.log(`Category ${category.name} (${category.id}): ${count || 0} shops`);
            }
        }
        // Also add total count - exclude hidden shops
        const { count: totalCount, error: totalError } = yield dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true })
            .or("claim_status.is.null,claim_status.neq.hidden");
        if (!totalError) {
            stats['all'] = totalCount || 0;
            console.log(`Total shops: ${totalCount || 0}`);
        }
        else {
            console.error('Error counting total shops:', totalError);
        }
        console.log('Category stats result:', stats);
        return res.json(stats);
    }
    catch (e) {
        console.error('Error during fetching category stats:', e);
        return res.status(500).json({ error: e.message });
    }
}));
// GET /categories/public-stats - Get shop counts by category field (for public shops page)
router.get("/public-stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('GET /categories/public-stats - Fetching category statistics by category field');
        // Category mapping: database values to display labels
        const categoryLabels = {
            'barber_shop': 'Barber Shop',
            'hair_salon': 'Hair Salon',
            'general_salon': 'General Salon',
            'nail_salon': 'Nail Salon',
            'eyelashes': 'Eyelashes',
            'spa_massage': 'Spa & Massage',
            'other': 'Other',
        };
        const stats = {};
        // Count shops for each category value
        for (const [dbValue, label] of Object.entries(categoryLabels)) {
            const { count, error } = yield dbClient
                .from("shops")
                .select("*", { count: 'exact', head: true })
                .eq("category", dbValue);
            if (error) {
                console.error(`Error counting shops for category ${dbValue}:`, error);
                stats[label] = 0;
            }
            else {
                stats[label] = count || 0;
                console.log(`Category ${label} (${dbValue}): ${count || 0} shops`);
            }
        }
        // Also count shops with null/empty category
        const { count: nullCount, error: nullError } = yield dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true })
            .or("category.is.null,category.eq.");
        if (!nullError) {
            stats['Other'] = (stats['Other'] || 0) + (nullCount || 0);
        }
        // Total count
        const { count: totalCount, error: totalError } = yield dbClient
            .from("shops")
            .select("*", { count: 'exact', head: true });
        if (!totalError) {
            stats['all'] = totalCount || 0;
        }
        console.log('Public category stats result:', stats);
        return res.json(stats);
    }
    catch (e) {
        console.error('Error during fetching public category stats:', e);
        return res.status(500).json({ error: e.message });
    }
}));
exports.default = router;
