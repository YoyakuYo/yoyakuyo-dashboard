"use strict";
// apps/api/src/services/customerService.ts
// Service for customer identification, history tracking, and personalization
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
exports.findOrCreateCustomer = findOrCreateCustomer;
exports.getCustomerLanguage = getCustomerLanguage;
exports.updateCustomerLanguage = updateCustomerLanguage;
exports.getCustomerHistory = getCustomerHistory;
exports.generatePersonalizedGreeting = generatePersonalizedGreeting;
const supabase_1 = require("../lib/supabase");
const languageDetectionService_1 = require("./languageDetectionService");
const customerIdService_1 = require("./customerIdService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
/**
 * Finds or creates a customer record based on email
 * Auto-detects and saves customer language from first message
 */
function findOrCreateCustomer(email, name, phone, firstMessage // Optional: first message to detect language
) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!email) {
                return { customerId: null, isNew: false };
            }
            // Try to find existing customer by email
            const { data: existingCustomer, error: findError } = yield dbClient
                .from('customers')
                .select('id, preferred_language')
                .eq('email', email.toLowerCase().trim())
                .single();
            if (existingCustomer) {
                // If customer exists but has no preferred_language and we have a first message, detect and save it
                if (!existingCustomer.preferred_language && firstMessage) {
                    const detectedLanguage = yield (0, languageDetectionService_1.detectLanguage)(firstMessage);
                    yield dbClient
                        .from('customers')
                        .update({ preferred_language: detectedLanguage })
                        .eq('id', existingCustomer.id);
                    console.log(`[CustomerService] Auto-detected and saved language ${detectedLanguage} for customer ${existingCustomer.id}`);
                }
                return { customerId: existingCustomer.id, isNew: false };
            }
            // Create new customer if not found
            if (name) {
                const nameParts = name.trim().split(' ');
                const firstName = nameParts[0] || name;
                const lastName = nameParts.slice(1).join(' ') || null;
                // Auto-detect language from first message if provided
                let preferredLanguage = null;
                if (firstMessage) {
                    preferredLanguage = yield (0, languageDetectionService_1.detectLanguage)(firstMessage);
                    console.log(`[CustomerService] Auto-detected language ${preferredLanguage} for new customer`);
                }
                const { data: newCustomer, error: createError } = yield dbClient
                    .from('customers')
                    .insert([{
                        email: email.toLowerCase().trim(),
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone || null,
                        preferred_language: preferredLanguage,
                    }])
                    .select('id')
                    .single();
                if (createError) {
                    console.error('Error creating customer:', createError);
                    return { customerId: null, isNew: false };
                }
                // Generate permanent customer ID and magic code
                if (newCustomer === null || newCustomer === void 0 ? void 0 : newCustomer.id) {
                    try {
                        yield (0, customerIdService_1.ensureCustomerId)(newCustomer.id, name);
                    }
                    catch (idError) {
                        console.error('Error generating customer ID:', idError);
                        // Continue even if ID generation fails
                    }
                }
                return { customerId: (newCustomer === null || newCustomer === void 0 ? void 0 : newCustomer.id) || null, isNew: true };
            }
            return { customerId: null, isNew: false };
        }
        catch (error) {
            console.error('Error in findOrCreateCustomer:', error);
            return { customerId: null, isNew: false };
        }
    });
}
/**
 * Get customer's preferred language (or detect from message if not set)
 */
function getCustomerLanguage(customerEmail, customerId, fallbackMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (customerId) {
                const { data: customer } = yield dbClient
                    .from('customers')
                    .select('preferred_language')
                    .eq('id', customerId)
                    .single();
                if (customer === null || customer === void 0 ? void 0 : customer.preferred_language) {
                    return customer.preferred_language;
                }
            }
            if (customerEmail) {
                const { data: customer } = yield dbClient
                    .from('customers')
                    .select('preferred_language')
                    .eq('email', customerEmail.toLowerCase().trim())
                    .single();
                if (customer === null || customer === void 0 ? void 0 : customer.preferred_language) {
                    return customer.preferred_language;
                }
            }
            // Fallback: detect from message if provided
            if (fallbackMessage) {
                return yield (0, languageDetectionService_1.detectLanguage)(fallbackMessage);
            }
            return 'en'; // Default to English
        }
        catch (error) {
            console.error('Error getting customer language:', error);
            return fallbackMessage ? yield (0, languageDetectionService_1.detectLanguage)(fallbackMessage) : 'en';
        }
    });
}
/**
 * Update customer's preferred language
 */
function updateCustomerLanguage(customerEmail, languageCode) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { error } = yield dbClient
                .from('customers')
                .update({ preferred_language: languageCode })
                .eq('email', customerEmail.toLowerCase().trim());
            if (error) {
                console.error('Error updating customer language:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error updating customer language:', error);
            return false;
        }
    });
}
/**
 * Gets customer history for personalization
 */
function getCustomerHistory(shopId, customerEmail, customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const history = {
                previousBookings: [],
                previousConversations: 0,
                isReturning: false,
            };
            if (!customerEmail && !customerId) {
                return history;
            }
            // Find customer by email or ID
            let customerQuery = dbClient.from('customers').select('id, first_name, last_name, email');
            if (customerId) {
                customerQuery = customerQuery.eq('id', customerId);
            }
            else if (customerEmail) {
                customerQuery = customerQuery.eq('email', customerEmail.toLowerCase().trim());
            }
            const { data: customer, error: customerError } = yield customerQuery.single();
            if (customerError || !customer) {
                return history;
            }
            history.customerId = customer.id;
            history.customerName = customer.first_name || null;
            history.customerEmail = customer.email || null;
            // Get previous bookings for this shop
            const { data: bookings, error: bookingsError } = yield dbClient
                .from('bookings')
                .select(`
        id,
        start_time,
        status,
        services(name)
      `)
                .eq('shop_id', shopId)
                .or(`customer_id.eq.${customer.id},customer_email.eq.${customerEmail || customer.email}`)
                .order('start_time', { ascending: false })
                .limit(5);
            if (!bookingsError && bookings) {
                history.previousBookings = bookings.map((b) => {
                    var _a;
                    return ({
                        id: b.id,
                        serviceName: ((_a = b.services) === null || _a === void 0 ? void 0 : _a.name) || null,
                        date: b.start_time,
                        status: b.status,
                    });
                });
                if (history.previousBookings.length > 0) {
                    history.isReturning = true;
                    history.lastInteraction = history.previousBookings[0].date;
                }
            }
            // Count previous conversations (threads)
            const { data: threads, error: threadsError } = yield dbClient
                .from('shop_threads')
                .select('id')
                .eq('shop_id', shopId)
                .eq('customer_email', customerEmail || customer.email);
            if (!threadsError && threads) {
                history.previousConversations = threads.length;
                if (threads.length > 0) {
                    history.isReturning = true;
                }
            }
            return history;
        }
        catch (error) {
            console.error('Error in getCustomerHistory:', error);
            return {
                previousBookings: [],
                previousConversations: 0,
                isReturning: false,
            };
        }
    });
}
/**
 * Generates personalized greeting for returning customers (fully multilingual)
 */
function generatePersonalizedGreeting(history_1) {
    return __awaiter(this, arguments, void 0, function* (history, languageCode = 'en') {
        const { generateMultilingualResponse } = yield Promise.resolve().then(() => __importStar(require('./multilingualService')));
        if (!history.isReturning || !history.customerName) {
            return yield generateMultilingualResponse('what_can_i_help', languageCode);
        }
        const name = history.customerName.split(' ')[0]; // First name only
        const lastBooking = history.previousBookings[0];
        if (lastBooking) {
            const lastService = lastBooking.serviceName || 'Service';
            const lastDate = new Date(lastBooking.date);
            const dateStr = lastDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            // Use multilingual service for welcome back message
            const welcomeMsg = yield generateMultilingualResponse('welcome_back', languageCode, { name });
            return `${welcomeMsg} How was your ${lastService} on ${dateStr}? ${yield generateMultilingualResponse('what_can_i_help', languageCode)}`;
        }
        const welcomeMsg = yield generateMultilingualResponse('welcome_back', languageCode, { name });
        return `${welcomeMsg} ${yield generateMultilingualResponse('what_can_i_help', languageCode)}`;
    });
}
