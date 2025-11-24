import express, { Request, Response, Router, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { supabaseAdmin, supabase } from '../lib/supabase';

const router = Router();

// Extend Request type to include file property from multer
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// POST /photos/upload - Upload photo to Supabase Storage
router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size exceeds 10MB limit' });
                }
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ error: err.message || 'File upload error' });
        }
        next();
    });
}, async (req: MulterRequest, res: Response) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { shopId, type } = req.body;

        // Validate required fields
        if (!shopId) {
            return res.status(400).json({ error: 'shopId is required' });
        }

        if (!type || !['logo', 'cover', 'gallery'].includes(type)) {
            return res.status(400).json({ error: "type must be 'logo', 'cover', or 'gallery'" });
        }

        // Get user ID from header
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
            return res.status(401).json({ error: 'User ID is required. Please provide x-user-id header.' });
        }

        // Verify user owns the shop
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('owner_user_id')
            .eq('id', shopId)
            .single();

        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: 'You do not own this shop' });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Supabase admin client not configured. SUPABASE_SERVICE_ROLE_KEY is required.' });
        }

        // Generate file path based on type
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        let filePath: string;
        if (type === 'gallery') {
            // Gallery photos: shop_${shopId}/gallery/${filename}
            filePath = `shop_${shopId}/gallery/${sanitizedFileName}`;
        } else {
            // Logo and cover: shop_${shopId}/${filename}
            filePath = `shop_${shopId}/${sanitizedFileName}`;
        }

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('shop_photos')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
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
        const { data: photoRecord, error: photoError } = await supabase
            .from('shop_photos')
            .insert({
                shop_id: shopId,
                type: type,
                url: publicUrl,
            })
            .select()
            .single();

        if (photoError) {
            console.error('Error inserting photo record:', photoError);
            return res.status(500).json({ error: `Failed to save photo record: ${photoError.message}` });
        }

        // For logo and cover, also update the shop record (backward compatibility)
        if (type === 'logo' || type === 'cover') {
            const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
            await supabase
                .from('shops')
                .update({ [updateField]: publicUrl })
                .eq('id', shopId);
        }

        // Return photo record with URL for immediate UI update
        return res.status(200).json({
            url: publicUrl,
            photo: photoRecord || null,
        });
    } catch (error: any) {
        console.error('Error handling file upload:', error);
        return res.status(500).json({ error: error.message || 'Failed to upload photo' });
    }
});

export default router;

