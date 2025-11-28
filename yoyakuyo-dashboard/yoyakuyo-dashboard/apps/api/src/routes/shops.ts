import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
const router = Router();

// Use service role client if available (bypasses RLS), otherwise use anon client
// Service role key bypasses RLS policies, which is needed for API operations
const dbClient = supabaseAdmin || supabase;

/**
 * Helper function to fetch all shops in batches (to overcome Supabase's 1000 row limit)
 * Fetches shops in batches of 1000 and combines them into a single array
 */
async function fetchAllShops(
    client: SupabaseClient,
    search?: string,
    category_id?: string,
    category?: string,  // New: filter by shops.category field
    owner_user_id?: string  // Filter by owner_user_id
): Promise<any[]> {
    const allShops: any[] = [];
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    console.log('fetchAllShops: Starting batch fetching...');
    console.log('  - Search filter:', search || 'none');
    console.log('  - Category filter:', category_id || 'none');
    console.log('  - Owner filter:', owner_user_id || 'none');

    while (hasMore) {
        // Build query for this batch - NO JOIN to avoid ambiguous relationship error
        // We'll fetch categories separately after getting shops
        let query = client
            .from("shops")
            .select("*")
            .order("name", { ascending: true })
            .range(offset, offset + batchSize - 1);

        // Apply search filter if provided
        if (search && search.trim()) {
            query = query.ilike("name", `%${search.trim()}%`);
        }

        // Apply category filter if provided and not empty
        // Support both category_id (foreign key) and category (direct field)
        if (category_id && category_id.trim() && category_id !== 'all' && category_id !== 'null') {
            query = query.eq("category_id", category_id);
        }
        if (category && category.trim() && category !== 'all') {
            query = query.eq("category", category);
        }
        
        // Apply owner filter if provided
        if (owner_user_id && owner_user_id.trim()) {
            query = query.eq("owner_user_id", owner_user_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error(`❌ Batch ${offset / batchSize + 1} failed:`, error.message);
            // If query fails, stop fetching
            break;
        }

        if (data && data.length > 0) {
            allShops.push(...data);
            console.log(`  Batch ${offset / batchSize + 1}: Fetched ${data.length} shops (total: ${allShops.length})`);
            
            // If we got less than batchSize, we've reached the end
            hasMore = data.length === batchSize;
            offset += batchSize;
        } else {
            hasMore = false;
        }
    }

    // Fetch categories separately for all shops that have category_id
    const categoryIds = [...new Set(allShops.map(shop => shop.category_id).filter(Boolean))];
    const categoryMap = new Map();
    
    if (categoryIds.length > 0) {
        const { data: categories, error: catError } = await client
            .from("categories")
            .select("id, name, description")
            .in("id", categoryIds);
        
        if (!catError && categories) {
            categories.forEach(cat => {
                categoryMap.set(cat.id, cat);
            });
        }
    }

    // Attach category data to shops
    const shopsWithCategories = allShops.map(shop => ({
        ...shop,
        categories: shop.category_id ? categoryMap.get(shop.category_id) || null : null
    }));

    console.log(`✅ fetchAllShops: Completed. Total shops fetched: ${shopsWithCategories.length}`);
    return shopsWithCategories;
}
router.get("/", async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        const category_id = req.query.category_id as string | undefined;
        const category = req.query.category as string | undefined;  // New: filter by shops.category field
        const owner_user_id = req.query.owner_user_id as string | undefined;  // Filter by owner
        const unclaimedParam = req.query.unclaimed as string | undefined;
        const unclaimed = unclaimedParam === 'true';  // Filter unclaimed shops
        
        // Pagination params
        const limitParam = req.query.limit as string | undefined;
        const offsetParam = req.query.offset as string | undefined;
        const pageParam = req.query.page as string | undefined;
        const usePagination = limitParam || pageParam; // Enable pagination if limit or page is provided
        
        // Calculate pagination
        const limit = usePagination ? Math.min(parseInt(limitParam || '50'), 1000) : undefined;
        const page = pageParam ? parseInt(pageParam) : undefined;
        const offset = offsetParam ? parseInt(offsetParam) : (page ? (page - 1) * (limit || 50) : undefined);
        
        console.log('=== GET /shops START ===');
        console.log('Query params:', { search, category_id, category, owner_user_id, unclaimed, limit, offset, page, usePagination });
        console.log('Using client:', supabaseAdmin ? 'service role (bypasses RLS)' : 'anon (subject to RLS)');
        
        // If unclaimed filter is set, fetch shops with owner_user_id IS NULL
        if (unclaimed) {
            let query = dbClient
                .from("shops")
                .select("*", { count: usePagination ? 'exact' : undefined })
                .is("owner_user_id", null)
                .order("name", { ascending: true });
            
            if (search && search.trim()) {
                query = query.ilike("name", `%${search.trim()}%`);
            }
            
            if (category_id && category_id.trim() && category_id !== 'all' && category_id !== 'null') {
                query = query.eq("category_id", category_id);
            }
            
            // Apply pagination if enabled
            if (usePagination && limit !== undefined && offset !== undefined) {
                query = query.range(offset, offset + limit - 1);
            }
            
            const { data, error, count } = await query;
            if (error) {
                console.error('Error fetching unclaimed shops:', error);
                return res.status(500).json({ error: error.message });
            }
            
            // Fetch categories separately to avoid ambiguous relationship error
            const shops = Array.isArray(data) ? data : [];
            const categoryIds = [...new Set(shops.map((shop: any) => shop.category_id).filter(Boolean))];
            const categoryMap = new Map();
            
            if (categoryIds.length > 0) {
                const { data: categories, error: catError } = await dbClient
                    .from("categories")
                    .select("id, name, description")
                    .in("id", categoryIds);
                
                if (!catError && categories) {
                    categories.forEach((cat: any) => {
                        categoryMap.set(cat.id, cat);
                    });
                }
            }
            
            // Attach category data to shops
            const shopsWithCategories = shops.map((shop: any) => ({
                ...shop,
                categories: shop.category_id ? categoryMap.get(shop.category_id) || null : null
            }));
            
            // Return paginated response if pagination is enabled
            if (usePagination) {
                return res.json({
                    shops: shopsWithCategories,
                    pagination: {
                        limit: limit || 50,
                        offset: offset || 0,
                        page: page || Math.floor((offset || 0) / (limit || 50)) + 1,
                        total: count || shopsWithCategories.length,
                        hasMore: limit !== undefined && shopsWithCategories.length === limit
                    }
                });
            }
            
            return res.json(shopsWithCategories);
        }
        
        // If pagination is enabled, use direct query instead of fetchAllShops
        if (usePagination && limit !== undefined && offset !== undefined) {
            let query = dbClient
                .from("shops")
                .select("*", { count: 'exact' })
                .order("name", { ascending: true })
                .range(offset, offset + limit - 1);
            
            // Apply filters
            if (search && search.trim()) {
                query = query.ilike("name", `%${search.trim()}%`);
            }
            if (category_id && category_id.trim() && category_id !== 'all' && category_id !== 'null') {
                query = query.eq("category_id", category_id);
            }
            if (category && category.trim() && category !== 'all') {
                query = query.eq("category", category);
            }
            if (owner_user_id && owner_user_id.trim()) {
                query = query.eq("owner_user_id", owner_user_id);
            }
            
            const { data, error, count } = await query;
            
            if (error) {
                console.error('Error fetching shops:', error);
                return res.status(500).json({ error: error.message });
            }
            
            const shops = Array.isArray(data) ? data : [];
            
            // Fetch categories separately
            const categoryIds = [...new Set(shops.map((shop: any) => shop.category_id).filter(Boolean))];
            const categoryMap = new Map();
            
            if (categoryIds.length > 0) {
                const { data: categories, error: catError } = await dbClient
                    .from("categories")
                    .select("id, name, description")
                    .in("id", categoryIds);
                
                if (!catError && categories) {
                    categories.forEach((cat: any) => {
                        categoryMap.set(cat.id, cat);
                    });
                }
            }
            
            const shopsWithCategories = shops.map((shop: any) => ({
                ...shop,
                categories: shop.category_id ? categoryMap.get(shop.category_id) || null : null
            }));
            
            console.log(`=== GET /shops END (paginated) === Shops: ${shopsWithCategories.length}, Total: ${count}`);
            
            return res.json({
                shops: shopsWithCategories,
                pagination: {
                    limit,
                    offset,
                    page: page || Math.floor(offset / limit) + 1,
                    total: count || shopsWithCategories.length,
                    hasMore: shopsWithCategories.length === limit
                }
            });
        }
        
        // Use batch fetching helper to get all shops (overcomes 1000 row limit) - for backward compatibility
        const data = await fetchAllShops(dbClient, search, category_id, category, owner_user_id);
        
        console.log(`=== GET /shops END === Total shops: ${data.length}`);
        
        // If filtering by owner_user_id and no shops found, return 404
        if (owner_user_id && data.length === 0) {
            return res.status(404).json({ error: 'No shop found for this owner' });
        }
        
        // Always return an array, never null or errors
        return res.json(Array.isArray(data) ? data : []);
    } catch (e: any) {
        console.error('❌ EXCEPTION in GET /shops:', e);
        console.error('Error message:', e.message);
        console.error('Error stack:', e.stack);
        return res.status(500).json({ 
            error: 'Exception while fetching shops',
            details: e.message
        });
    }
});
// GET /shops/search/osm - Search OpenStreetMap for businesses
router.get("/search/osm", async (req: Request, res: Response) => {
    try {
        const { q, location, lat, lng, limit = 20 } = req.query;
        
        if (!q && !location) {
            return res.status(400).json({ error: "Query (q) or location parameter required" });
        }

        // Build Nominatim search URL
        const baseUrl = "https://nominatim.openstreetmap.org/search";
        const params = new URLSearchParams({
            q: (q as string) || (location as string),
            format: "json",
            addressdetails: "1",
            limit: limit.toString(),
            countrycodes: "jp", // Japan only
            dedupe: "1",
        });

        // If lat/lng provided, add bounding box
        if (lat && lng) {
            const latNum = parseFloat(lat as string);
            const lngNum = parseFloat(lng as string);
            const bbox = `${(lngNum - 0.1)},${(latNum - 0.1)},${(lngNum + 0.1)},${(latNum + 0.1)}`;
            params.append("viewbox", bbox);
            params.append("bounded", "1");
        }

        // Add user agent (required by Nominatim)
        const response = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                'User-Agent': 'Bookyo-Shop-Finder/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = (await response.json()) as any[];

        // Import utilities
        const { checkShopDuplicate } = require("../utils/shopDuplicateChecker");
        const { assignCategory, getCategoryId } = require("../utils/shopCategorizer");

        // Transform and check duplicates
        const shops = await Promise.all(
            data.map(async (place: any) => {
                const shopData = {
                    name: place.display_name.split(',')[0].trim(),
                    address: place.display_name,
                    latitude: parseFloat(place.lat),
                    longitude: parseFloat(place.lon),
                    city: place.address?.city || place.address?.town || place.address?.village || null,
                    country: place.address?.country || null,
                    zip_code: place.address?.postcode || null,
                    phone: null,
                    email: null,
                    website: null,
                    osm_id: place.osm_id?.toString(),
                    osm_type: place.osm_type,
                };

                // Check for duplicates
                const duplicateCheck = await checkShopDuplicate(dbClient, shopData);
                
                // Auto-assign category
                const categoryName = assignCategory(shopData);
                const categoryId = await getCategoryId(dbClient, categoryName);

                return {
                    ...shopData,
                    isDuplicate: duplicateCheck.isDuplicate,
                    existingShop: duplicateCheck.existingShop,
                    duplicateReason: duplicateCheck.reason,
                    category_id: categoryId,
                    category_name: categoryName,
                };
            })
        );

        return res.json(shops);
    } catch (error: any) {
        console.error("Error searching OpenStreetMap:", error);
        return res.status(500).json({ error: error.message || "Failed to search OpenStreetMap" });
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const { name, address, phone, email, category_id, description, website, google_place_id, city, country, zip_code, language_code } = req.body;
        // Get user_id from header (x-user-id) or body for now
        // TODO: Replace with proper auth token validation
        const userId = req.headers['x-user-id'] as string || req.body.user_id;
        
        const shopData: any = { name, address, phone, email };
        
        // Add optional fields if provided
        if (category_id) shopData.category_id = category_id;
        if (description !== undefined) shopData.description = description;
        if (website !== undefined) shopData.website = website;
        if (google_place_id !== undefined) shopData.google_place_id = google_place_id;
        if (city !== undefined) shopData.city = city;
        if (country !== undefined) shopData.country = country;
        if (zip_code !== undefined) shopData.zip_code = zip_code;
        if (language_code !== undefined) shopData.language_code = language_code;
        
        // If user_id is provided, set owner and claim status
        if (userId) {
            shopData.owner_user_id = userId;
            shopData.claim_status = 'approved';
            shopData.claimed_at = new Date().toISOString();
        } else {
            shopData.claim_status = 'unclaimed';
        }
        
        const { data: insertedData, error } = await dbClient
            .from("shops")
            .insert([shopData])
            .select("*")
            .single();
        
        if (error) return res.status(500).json({ error: error.message });
        
        // If shop has category_id, fetch category separately to avoid ambiguous relationship
        let categoryData = null;
        if (insertedData?.category_id) {
            const { data: catData, error: catError } = await dbClient
                .from("categories")
                .select("id, name, description")
                .eq("id", insertedData.category_id)
                .single();
            
            if (!catError && catData) {
                categoryData = catData;
            }
        }
        
        // Merge category data into shop data
        const data = {
            ...insertedData,
            categories: categoryData
        };
        
        return res.status(201).json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

// UUID validation helper
const isValidUUID = (id: string): boolean => {
    if (!id || typeof id !== 'string' || id === 'undefined' || id === 'null') {
        return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

// GET /shops/:id/photos - Get all photos for a shop (MUST come before /:id route)
router.get("/:id/photos", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const type = req.query.type as string | undefined; // Optional filter by type

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: "Invalid shop id" });
        }

        let query = dbClient
            .from('shop_photos')
            .select('*')
            .eq('shop_id', id)
            .order('created_at', { ascending: false });

        if (type && ['logo', 'cover', 'gallery'].includes(type)) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching photos:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.json(Array.isArray(data) ? data : []);
    } catch (e: any) {
        console.error('Error fetching photos:', e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /shops/:id/photos - Upload photo (MUST come before /:id route)
router.post("/:id/photos", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fileName, type, fileData } = req.body; // fileData is base64 encoded file
        const userId = req.headers['x-user-id'] as string;

        // Validate inputs
        if (!userId) {
            return res.status(401).json({ error: "User ID is required. Please provide x-user-id header." });
        }

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: "Invalid shop id" });
        }

        if (!fileName || typeof fileName !== 'string') {
            return res.status(400).json({ error: "fileName is required" });
        }

        if (!type || !['logo', 'cover', 'gallery'].includes(type)) {
            return res.status(400).json({ error: "type must be 'logo', 'cover', or 'gallery'" });
        }

        if (!fileData || typeof fileData !== 'string') {
            return res.status(400).json({ error: "fileData (base64) is required" });
        }

        // Verify user owns the shop
        const { data: shop, error: shopError } = await dbClient
            .from("shops")
            .select("owner_user_id")
            .eq("id", id)
            .single();

        if (shopError || !shop) {
            return res.status(404).json({ error: "Shop not found" });
        }

        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: "You do not own this shop" });
        }

        // Validate file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExtension)) {
            return res.status(400).json({ error: "File must be .jpg, .jpeg, or .png" });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({ error: "Supabase admin client not configured. SUPABASE_SERVICE_ROLE_KEY is required." });
        }

        // Generate unique file path
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${id}/${type}/${timestamp}_${sanitizedFileName}`;

        // Convert base64 to buffer
        const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine content type
        const contentType = fileExtension === '.png' ? 'image/png' : 'image/jpeg';

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('shop_photos')
            .upload(filePath, buffer, {
                contentType: contentType,
                upsert: true,
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from('shop_photos')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData?.publicUrl || '';

        // Insert photo record into shop_photos table
        const { data: photoRecord, error: photoError } = await dbClient
            .from('shop_photos')
            .insert({
                shop_id: id,
                type: type,
                url: publicUrl,
            })
            .select()
            .single();

        if (photoError) {
            console.error('Error inserting photo record:', photoError);
            // Don't fail the upload, but log the error
            // The file is already uploaded, we just couldn't create the record
        }

        // For logo and cover, also update the shop record (backward compatibility)
        if (type === 'logo' || type === 'cover') {
            const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
            await dbClient
                .from('shops')
                .update({ [updateField]: publicUrl })
                .eq('id', id);
        }

        return res.status(200).json({
            publicUrl: publicUrl,
            path: filePath,
            photoId: photoRecord?.id || null,
        });
    } catch (e: any) {
        console.error('Error handling file upload:', e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /shops/:id/photo/logo - Upload logo (convenience route, redirects to /photos/upload)
router.post("/:id/photo/logo", async (req: Request, res: Response) => {
    // This route is kept for backward compatibility
    // It should redirect to the new /photos/upload endpoint
    // For now, we'll return a helpful error message
    return res.status(410).json({ 
        error: 'This endpoint is deprecated. Please use POST /photos/upload with type=logo in the form data.' 
    });
});

// POST /shops/:id/photo/cover - Upload cover (convenience route, redirects to /photos/upload)
router.post("/:id/photo/cover", async (req: Request, res: Response) => {
    // This route is kept for backward compatibility
    // It should redirect to the new /photos/upload endpoint
    // For now, we'll return a helpful error message
    return res.status(410).json({ 
        error: 'This endpoint is deprecated. Please use POST /photos/upload with type=cover in the form data.' 
    });
});

// DELETE /shops/:id/photos/:photoId - Delete a photo (MUST come before /:id route)
router.delete("/:id/photos/:photoId", async (req: Request, res: Response) => {
    try {
        const { id, photoId } = req.params;
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: "User ID is required. Please provide x-user-id header." });
        }

        if (!isValidUUID(id) || !isValidUUID(photoId)) {
            return res.status(400).json({ error: "Invalid shop id or photo id" });
        }

        // Verify user owns the shop
        const { data: shop, error: shopError } = await dbClient
            .from("shops")
            .select("owner_user_id")
            .eq("id", id)
            .single();

        if (shopError || !shop) {
            return res.status(404).json({ error: "Shop not found" });
        }

        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: "You do not own this shop" });
        }

        // Get photo record to get the file path
        const { data: photo, error: photoError } = await dbClient
            .from('shop_photos')
            .select('*')
            .eq('id', photoId)
            .eq('shop_id', id)
            .single();

        if (photoError || !photo) {
            return res.status(404).json({ error: "Photo not found" });
        }

        // Extract file path from URL
        const urlParts = photo.url.split('/shop_photos/');
        const filePath = urlParts.length > 1 ? urlParts[1] : null;

        // Delete from storage if path exists
        if (filePath && supabaseAdmin) {
            const { error: storageError } = await supabaseAdmin.storage
                .from('shop_photos')
                .remove([filePath]);

            if (storageError) {
                console.error('Error deleting file from storage:', storageError);
                // Continue to delete the record even if storage deletion fails
            }
        }

        // Delete photo record
        const { error: deleteError } = await dbClient
            .from('shop_photos')
            .delete()
            .eq('id', photoId)
            .eq('shop_id', id);

        if (deleteError) {
            console.error('Error deleting photo record:', deleteError);
            return res.status(500).json({ error: deleteError.message });
        }

        // If it was a logo or cover, also clear the shop record
        if (photo.type === 'logo' || photo.type === 'cover') {
            const updateField = photo.type === 'logo' ? 'logo_url' : 'cover_photo_url';
            await dbClient
                .from('shops')
                .update({ [updateField]: null })
                .eq('id', id);
        }

        return res.status(200).json({ message: 'Photo deleted successfully' });
    } catch (e: any) {
        console.error('Error deleting photo:', e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /shops/:id/holidays - Get shop holidays (MUST come before /:id route)
router.get("/:id/holidays", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ error: "Invalid shop id" });
        }
        
        if (!isValidUUID(id)) {
            return res.status(400).json({ error: "Invalid shop id" });
        }
        
        const { getShopHolidays } = require('../services/calendarService');
        const holidays = await getShopHolidays(id);
        
        return res.json(holidays);
    } catch (e: any) {
        console.error('Error fetching shop holidays:', e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /shops/:id - MUST come after nested routes to avoid route conflicts
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Validate UUID before querying database
        if (!id || id === 'undefined' || id === 'null') {
            console.error('Invalid shop ID: undefined/null');
            return res.status(400).json({ error: "Invalid shop id" });
        }
        
        if (!isValidUUID(id)) {
            console.error(`Invalid UUID format: ${id}`);
            return res.status(400).json({ error: "Invalid shop id" });
        }
        
        console.log(`Fetching shop with id: ${id}`);
        
        // First fetch shop with services and staff (avoid ambiguous categories join)
        const { data: shopData, error: shopError } = await dbClient
            .from("shops")
            .select("*, services(*), staff(*)")
            .eq("id", id)
            .single();
        
        if (shopError) {
            console.error('Error fetching shop:', shopError);
            // Check if it's a "no rows" error
            if (shopError.code === 'PGRST116') {
                return res.status(404).json({ error: `Shop with id ${id} not found` });
            }
            // Check for UUID format errors from database
            if (shopError.message && shopError.message.includes('invalid input syntax for type uuid')) {
                return res.status(400).json({ error: "Invalid shop id" });
            }
            return res.status(500).json({ error: shopError.message });
        }
        
        if (!shopData) {
            return res.status(404).json({ error: `Shop with id ${id} not found` });
        }
        
        // If shop has category_id, fetch category separately to avoid ambiguous relationship
        let categoryData = null;
        if (shopData.category_id) {
            const { data: catData, error: catError } = await dbClient
                .from("categories")
                .select("id, name, description")
                .eq("id", shopData.category_id)
                .single();
            
            if (!catError && catData) {
                categoryData = catData;
            }
        }
        
        // Merge category data into shop data
        const data = {
            ...shopData,
            categories: categoryData
        };
        
        return res.json(data);
    } catch (e: any) {
        console.error('Exception fetching shop:', e);
        // Catch UUID format errors
        if (e.message && e.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ error: "Invalid shop id" });
        }
        return res.status(500).json({ error: e.message });
    }
});

// POST /shops/:id/claim - Claim a shop (MUST come before nested routes)
router.post("/:id/claim", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        
        // Get user_id from header (x-user-id) or body for now
        // TODO: Replace with proper auth token validation
        const userId = req.headers['x-user-id'] as string || req.body.user_id;
        
        if (!userId) {
            return res.status(401).json({ error: "User ID is required. Please provide x-user-id header or user_id in body." });
        }
        
        // Validate UUID
        if (!isValidUUID(id)) {
            return res.status(400).json({ error: "Invalid shop id" });
        }
        
        // Fetch the shop
        const { data: shop, error: fetchError } = await dbClient
            .from("shops")
            .select("*")
            .eq("id", id)
            .single();
            
        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: `Shop with id ${id} not found` });
            }
            return res.status(500).json({ error: fetchError.message });
        }
        
        // Check if shop is already claimed by someone else
        if (shop.owner_user_id && shop.owner_user_id !== userId) {
            return res.status(403).json({ error: "This shop is already owned by another user" });
        }
        
        // Check if shop is already claimed by this user
        if (shop.owner_user_id === userId) {
            return res.status(200).json({ ...shop, message: "You already own this shop" });
        }
        
        // Claim the shop (auto-approve for now)
        const { data: updatedShop, error: updateError } = await dbClient
            .from("shops")
            .update({
                owner_user_id: userId,
                claim_status: 'approved',
                claimed_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select("*")
            .single();
            
        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }
        
        return res.status(200).json(updatedShop);
    } catch (e: any) {
        console.error('Error claiming shop:', e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /shops/:shopId/availability?date=YYYY-MM-DD
router.get("/:shopId/availability", async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const date = req.query.date as string;

        if (!date) {
            return res.status(400).json({ error: "Date is required" });
        }

        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay(); // 0 (Sunday) to 6 (Saturday)

        // Fetch all staff members for the shop
        const { data: staff, error: staffError } = await supabase
            .from("staff")
            .select("id")
            .eq("shop_id", shopId);

        if (staffError) {
            console.error("Error fetching staff:", staffError);
            return res.status(500).json({ error: "Failed to fetch staff" });
        }

        if (!staff || staff.length === 0) {
            return res.json([]); // No staff, no availability
        }

        // Fetch availability for each staff member on the given day of the week
        const availabilityPromises = staff.map((s) =>
            supabase
                .from("availability")
                .select("*")
                .eq("staff_id", s.id)
                .eq("day_of_week", dayOfWeek)
        );

        const availabilityResults = await Promise.all(availabilityPromises);

        // Combine availability results from all staff members
        const availability = availabilityResults.reduce((acc: any[], result) => {
            if (result.error) {
                console.error("Error fetching availability:", result.error);
                return acc; // Skip on error, don't return error to client
            }
            return acc.concat(result.data || []);
        }, []);

        // Ensure we always return an array
        return res.json(Array.isArray(availability) ? availability : []);
    } catch (e: any) {
        console.error("Error during availability retrieval:", e);
        // Return empty array to prevent frontend crashes
        return res.status(200).json([]);
    }
});

// GET /shops/:shopId/services
router.get("/:shopId/services", async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const { data: services, error } = await dbClient
            .from("services")
            .select("*")
            .eq("shop_id", shopId)
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching services:", error);
            // Return empty array to prevent frontend .map() errors
            return res.status(200).json([]);
        }

        // Ensure we always return an array
        return res.json(Array.isArray(services) ? services : []);
    } catch (e: any) {
        console.error("Error during fetching services:", e);
        // Return empty array to prevent frontend crashes
        return res.status(200).json([]);
    }
});

// POST /shops/:shopId/services
router.post("/:shopId/services", async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const { name, description, price, duration } = req.body;

        const { data: newService, error } = await supabase
            .from("services")
            .insert([
                {
                    shop_id: shopId,
                    name,
                    description,
                    price,
                    duration,
                }
            ])
            .select("*");

        if (error) {
            console.error("Error creating service:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(newService?.[0] ?? { message: "Service created" });
    } catch (e: any) {
        console.error("Error during service creation:", e);
        return res.status(500).json({ error: e.message });
    }
});

// GET /shops/:shopId/staff
router.get("/:shopId/staff", async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const { data: staff, error } = await supabase
            .from("staff")
            .select("*")
            .eq("shop_id", shopId);

        if (error) {
            console.error("Error fetching staff:", error);
            // Return empty array to prevent frontend .map() errors
            return res.status(200).json([]);
        }

        // Ensure we always return an array
        return res.json(Array.isArray(staff) ? staff : []);
    } catch (e: any) {
        console.error("Error during fetching staff:", e);
        // Return empty array to prevent frontend crashes
        return res.status(200).json([]);
    }
});

// POST /shops/:shopId/staff
router.post("/:shopId/staff", async (req: Request, res: Response) => {
    try {
        const { shopId } = req.params;
        const { first_name, last_name, phone, email } = req.body;

        const { data: newStaff, error } = await supabase
            .from("staff")
            .insert([
                {
                    shop_id: shopId,
                    first_name,
                    last_name,
                    phone,
                    email,
                }
            ])
            .select("*");

        if (error) {
            console.error("Error creating staff:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(newStaff?.[0] ?? { message: "Staff created" });
    } catch (e: any) {
        console.error("Error during staff creation:", e);
        return res.status(500).json({ error: e.message });
    }
});

// POST /shops/:id/upload-url - Upload image and return public URL (DEPRECATED - use /:id/photos instead)
// Keeping for backward compatibility
router.post("/:id/upload-url", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fileName, type, fileData } = req.body; // fileData is base64 encoded file
        const userId = req.headers['x-user-id'] as string;

        // Validate inputs
        if (!userId) {
            return res.status(401).json({ error: "User ID is required. Please provide x-user-id header." });
        }

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: "Invalid shop id" });
        }

        if (!fileName || typeof fileName !== 'string') {
            return res.status(400).json({ error: "fileName is required" });
        }

        if (!type || !['logo', 'cover', 'gallery'].includes(type)) {
            return res.status(400).json({ error: "type must be 'logo', 'cover', or 'gallery'" });
        }

        if (!fileData || typeof fileData !== 'string') {
            return res.status(400).json({ error: "fileData (base64) is required" });
        }

        // Verify user owns the shop
        const { data: shop, error: shopError } = await dbClient
            .from("shops")
            .select("owner_user_id")
            .eq("id", id)
            .single();

        if (shopError || !shop) {
            return res.status(404).json({ error: "Shop not found" });
        }

        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: "You do not own this shop" });
        }

        // Validate file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExtension)) {
            return res.status(400).json({ error: "File must be .jpg, .jpeg, or .png" });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({ error: "Supabase admin client not configured. SUPABASE_SERVICE_ROLE_KEY is required." });
        }

        // Generate unique file path
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${id}/${type}/${timestamp}_${sanitizedFileName}`;

        // Convert base64 to buffer
        const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine content type
        const contentType = fileExtension === '.png' ? 'image/png' : 'image/jpeg';

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('shop_photos')
            .upload(filePath, buffer, {
                contentType: contentType,
                upsert: true,
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from('shop_photos')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData?.publicUrl || '';

        // Insert photo record into shop_photos table
        const { data: photoRecord, error: photoError } = await dbClient
            .from('shop_photos')
            .insert({
                shop_id: id,
                type: type,
                url: publicUrl,
            })
            .select()
            .single();

        if (photoError) {
            console.error('Error inserting photo record:', photoError);
            // Don't fail the upload, but log the error
            // The file is already uploaded, we just couldn't create the record
        }

        // For logo and cover, also update the shop record (backward compatibility)
        if (type === 'logo' || type === 'cover') {
            const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
            await dbClient
                .from('shops')
                .update({ [updateField]: publicUrl })
                .eq('id', id);
        }

        return res.status(200).json({
            publicUrl: publicUrl,
            path: filePath,
            photoId: photoRecord?.id || null,
        });
    } catch (e: any) {
        console.error('Error handling file upload:', e);
        return res.status(500).json({ error: e.message });
    }
});

// PUT /shops/:id - Update shop (full update)
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Accept all fields that exist in the shops table
        const { name, address, phone, email, website, google_place_id, city, country, zip_code, description, language_code } = req.body;
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: "User ID is required. Please provide x-user-id header." });
        }

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: "Invalid shop id" });
        }

        // Verify user owns the shop
        const { data: shop, error: shopError } = await dbClient
            .from("shops")
            .select("owner_user_id")
            .eq("id", id)
            .single();

        if (shopError || !shop) {
            return res.status(404).json({ error: "Shop not found" });
        }

        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: "You do not own this shop" });
        }

        // Build update object - include all fields that exist in the database
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (website !== undefined) updateData.website = website;
        if (google_place_id !== undefined) updateData.google_place_id = google_place_id;
        if (city !== undefined) updateData.city = city;
        if (country !== undefined) updateData.country = country;
        if (zip_code !== undefined) updateData.zip_code = zip_code;
        if (description !== undefined) updateData.description = description;
        if (language_code !== undefined) updateData.language_code = language_code;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        // Update shop - include all fields in select statement
        const { data: updatedShop, error: updateError } = await dbClient
            .from("shops")
            .update(updateData)
            .eq("id", id)
            .select("id, name, address, phone, email, category_id, description, owner_user_id, claim_status, claimed_at, logo_url, cover_photo_url, website, google_place_id, city, country, zip_code, language_code, latitude, longitude, opening_hours, business_status, created_at, updated_at")
            .single();

        if (updateError) {
            console.error('Error updating shop:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        if (!updatedShop) {
            return res.status(404).json({ error: "Shop not found after update" });
        }

        // Fetch category separately to avoid ambiguous relationship error
        let categoryData = null;
        if (updatedShop.category_id) {
            const { data: catData, error: catError } = await dbClient
                .from("categories")
                .select("id, name, description")
                .eq("id", updatedShop.category_id)
                .single();
            
            if (!catError && catData) {
                categoryData = catData;
            }
        }

        // Build response with category data (never use join in select)
        const responseData = {
            ...updatedShop,
            categories: categoryData
        };

        return res.status(200).json(responseData);
    } catch (e: any) {
        console.error('Error updating shop:', e);
        return res.status(500).json({ error: e.message });
    }
});

// PATCH /shops/:id - Update shop (for saving logo/cover URLs)
router.patch("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { logo_url, cover_photo_url } = req.body;
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: "User ID is required. Please provide x-user-id header." });
        }

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: "Invalid shop id" });
        }

        // Verify user owns the shop
        const { data: shop, error: shopError } = await dbClient
            .from("shops")
            .select("owner_user_id")
            .eq("id", id)
            .single();

        if (shopError || !shop) {
            return res.status(404).json({ error: "Shop not found" });
        }

        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: "You do not own this shop" });
        }

        // Build update object
        const updateData: any = {};
        if (logo_url !== undefined) updateData.logo_url = logo_url;
        if (cover_photo_url !== undefined) updateData.cover_photo_url = cover_photo_url;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        // Update shop
        const { data: updatedShop, error: updateError } = await dbClient
            .from("shops")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .single();

        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }

        return res.status(200).json(updatedShop);
    } catch (e: any) {
        console.error('Error updating shop:', e);
        return res.status(500).json({ error: e.message });
    }
});

export default router;