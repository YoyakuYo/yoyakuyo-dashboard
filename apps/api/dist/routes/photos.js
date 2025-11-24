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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
// POST /photos/upload - Upload photo to Supabase Storage
router.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err instanceof multer_1.default.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size exceeds 10MB limit' });
                }
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ error: err.message || 'File upload error' });
        }
        next();
    });
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'User ID is required. Please provide x-user-id header.' });
        }
        // Verify user owns the shop
        const { data: shop, error: shopError } = yield supabase_1.supabase
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
        if (!supabase_1.supabaseAdmin) {
            return res.status(500).json({ error: 'Supabase admin client not configured. SUPABASE_SERVICE_ROLE_KEY is required.' });
        }
        // Generate file path based on type
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        let filePath;
        if (type === 'gallery') {
            // Gallery photos: shop_${shopId}/gallery/${filename}
            filePath = `shop_${shopId}/gallery/${sanitizedFileName}`;
        }
        else {
            // Logo and cover: shop_${shopId}/${filename}
            filePath = `shop_${shopId}/${sanitizedFileName}`;
        }
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = yield supabase_1.supabaseAdmin.storage
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
        const { data: publicUrlData } = supabase_1.supabaseAdmin.storage
            .from('shop_photos')
            .getPublicUrl(filePath);
        const publicUrl = (publicUrlData === null || publicUrlData === void 0 ? void 0 : publicUrlData.publicUrl) || '';
        // Insert photo record into shop_photos table
        const { data: photoRecord, error: photoError } = yield supabase_1.supabase
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
            yield supabase_1.supabase
                .from('shops')
                .update({ [updateField]: publicUrl })
                .eq('id', shopId);
        }
        // Return photo record with URL for immediate UI update
        return res.status(200).json({
            url: publicUrl,
            photo: photoRecord || null,
        });
    }
    catch (error) {
        console.error('Error handling file upload:', error);
        return res.status(500).json({ error: error.message || 'Failed to upload photo' });
    }
}));
exports.default = router;
