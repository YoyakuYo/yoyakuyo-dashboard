"use strict";
// apps/api/src/services/bookingService.ts
// Reusable booking creation service for AI and manual booking flows
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.createBookingFromAi = createBookingFromAi;
exports.getShopDetails = getShopDetails;
exports.getServiceDetails = getServiceDetails;
exports.getStaffDetails = getStaffDetails;
exports.getShopServices = getShopServices;
exports.getShopStaff = getShopStaff;
const supabase_1 = require("../lib/supabase");
const customerService_1 = require("./customerService");
const customerIdService_1 = require("./customerIdService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
/**
 * Creates a booking in Supabase from AI conversation or manual flow
 * Reuses the same table and defaults as the existing manual booking flow
 */
function createBookingFromAi(input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate required fields (NO email/phone required - only name)
            if (!input.shopId || !input.customerName) {
                return {
                    success: false,
                    error: 'shopId and customerName are required',
                };
            }
            if (!input.startTime || !input.endTime) {
                return {
                    success: false,
                    error: 'startTime and endTime are required',
                };
            }
            // Validate that start_time is in the future
            const startDate = new Date(input.startTime);
            const now = new Date();
            if (startDate <= now) {
                return {
                    success: false,
                    error: 'startTime must be in the future',
                };
            }
            // Validate that end_time is after start_time
            const endDate = new Date(input.endTime);
            if (endDate <= startDate) {
                return {
                    success: false,
                    error: 'endTime must be after startTime',
                };
            }
            // Create or find customer record (NO email/phone - only name)
            // Use a placeholder email for customer lookup (will be replaced by permanent ID system)
            const placeholderEmail = `customer_${Date.now()}@yoyaku-yo.temp`;
            const { customerId } = yield (0, customerService_1.findOrCreateCustomer)(placeholderEmail, input.customerName, undefined // No phone
            );
            // Ensure customer has permanent ID and magic code
            if (customerId) {
                try {
                    yield (0, customerIdService_1.ensureCustomerId)(customerId, input.customerName);
                }
                catch (idError) {
                    console.error('Error ensuring customer ID:', idError);
                    // Continue even if ID generation fails
                }
            }
            // Prepare booking data (same structure as manual booking flow)
            const bookingData = {
                shop_id: input.shopId,
                service_id: input.serviceId || null,
                staff_id: input.staffId || null,
                timeslot_id: input.timeslotId || null,
                start_time: input.startTime,
                end_time: input.endTime,
                customer_name: input.customerName,
                customer_email: input.customerEmail,
                customer_phone: input.customerPhone || null,
                language_code: input.languageCode || null,
                notes: input.notes || null,
                customer_id: input.customerId || customerId || null, // Use created customer ID if available
                status: 'pending', // Same default as manual booking flow
                created_by_ai: true, // Mark as AI-created booking
            };
            // Insert booking into Supabase
            const { data: newBooking, error } = yield dbClient
                .from('bookings')
                .insert([bookingData])
                .select('*')
                .single();
            if (error) {
                console.error('Error creating booking from AI:', error);
                return {
                    success: false,
                    error: error.message,
                };
            }
            // Send LINE notification if customer has LINE connected (non-blocking)
            if (customerId) {
                try {
                    const { sendBookingConfirmation } = yield Promise.resolve().then(() => __importStar(require('./lineService')));
                    const shop = yield getShopDetails(input.shopId);
                    const service = input.serviceId ? yield getServiceDetails(input.serviceId) : null;
                    if (shop && service) {
                        const startDate = new Date(input.startTime);
                        sendBookingConfirmation(customerId, {
                            shopName: shop.name || 'Shop',
                            serviceName: service.name || 'Service',
                            date: startDate.toLocaleDateString('ja-JP'),
                            time: startDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                            bookingId: newBooking.id,
                        }).catch((err) => {
                            console.error('Failed to send LINE notification (non-blocking):', err);
                        });
                    }
                }
                catch (lineError) {
                    // LINE notification is optional - don't fail booking if it fails
                    console.error('LINE notification error (non-blocking):', lineError);
                }
            }
            return {
                success: true,
                booking: newBooking,
            };
        }
        catch (error) {
            console.error('Error in createBookingFromAi:', error);
            return {
                success: false,
                error: error.message || 'Unknown error creating booking',
            };
        }
    });
}
/**
 * Fetches shop details for booking confirmation
 */
function getShopDetails(shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: shop, error } = yield dbClient
                .from('shops')
                .select('id, name, category, description, address, phone, email, city, prefecture, opening_hours')
                .eq('id', shopId)
                .single();
            if (error) {
                console.error('Error fetching shop details:', error);
                return null;
            }
            return shop;
        }
        catch (error) {
            console.error('Error in getShopDetails:', error);
            return null;
        }
    });
}
/**
 * Fetches service details for booking confirmation
 */
function getServiceDetails(serviceId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: service, error } = yield dbClient
                .from('services')
                .select('id, name, duration_minutes, duration, price')
                .eq('id', serviceId)
                .single();
            if (error) {
                console.error('Error fetching service details:', error);
                return null;
            }
            return service;
        }
        catch (error) {
            console.error('Error in getServiceDetails:', error);
            return null;
        }
    });
}
/**
 * Fetches staff details for booking confirmation
 */
function getStaffDetails(staffId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: staff, error } = yield dbClient
                .from('staff')
                .select('id, first_name, last_name')
                .eq('id', staffId)
                .single();
            if (error) {
                console.error('Error fetching staff details:', error);
                return null;
            }
            return staff;
        }
        catch (error) {
            console.error('Error in getStaffDetails:', error);
            return null;
        }
    });
}
/**
 * Fetches all services for a shop (for AI to match service names to IDs)
 */
function getShopServices(shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: services, error } = yield dbClient
                .from('services')
                .select('id, name, duration_minutes, duration')
                .eq('shop_id', shopId)
                .order('name', { ascending: true });
            if (error) {
                console.error('Error fetching shop services:', error);
                return [];
            }
            return services || [];
        }
        catch (error) {
            console.error('Error in getShopServices:', error);
            return [];
        }
    });
}
/**
 * Fetches all staff for a shop (for AI to match staff names to IDs)
 */
function getShopStaff(shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: staff, error } = yield dbClient
                .from('staff')
                .select('id, first_name, last_name')
                .eq('shop_id', shopId)
                .order('first_name', { ascending: true });
            if (error) {
                console.error('Error fetching shop staff:', error);
                return [];
            }
            return staff || [];
        }
        catch (error) {
            console.error('Error in getShopStaff:', error);
            return [];
        }
    });
}
