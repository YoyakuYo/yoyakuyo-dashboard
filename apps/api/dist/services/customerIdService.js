"use strict";
// apps/api/src/services/customerIdService.ts
// Service for generating permanent customer IDs (Mario X44 format) and magic codes
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
exports.generateCustomerId = generateCustomerId;
exports.generateMagicCode = generateMagicCode;
exports.ensureCustomerId = ensureCustomerId;
exports.findCustomerByMagicCode = findCustomerByMagicCode;
const supabase_1 = require("../lib/supabase");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
/**
 * Generate a permanent customer ID in format: Name LetterNumber (e.g., Mario X44, Yuki K9)
 */
function generateCustomerId(name) {
    // Extract first name
    const firstName = name.trim().split(' ')[0] || name.trim();
    // Generate random letter (A-Z)
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    // Generate random 2-digit number (00-99)
    const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${firstName} ${letter}${number}`;
}
/**
 * Generate a unique 8-character magic code for chat URLs
 */
function generateMagicCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
/**
 * Ensure customer has a permanent ID and magic code
 * Creates them if they don't exist
 */
function ensureCustomerId(customerId, customerName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get current customer
            const { data: customer, error: fetchError } = yield dbClient
                .from('customers')
                .select('customer_id_display, magic_code')
                .eq('id', customerId)
                .single();
            if (fetchError) {
                console.error('Error fetching customer:', fetchError);
                throw fetchError;
            }
            let customerIdDisplay = customer === null || customer === void 0 ? void 0 : customer.customer_id_display;
            let magicCode = customer === null || customer === void 0 ? void 0 : customer.magic_code;
            // Generate ID if missing
            if (!customerIdDisplay) {
                let attempts = 0;
                let isUnique = false;
                while (!isUnique && attempts < 10) {
                    customerIdDisplay = generateCustomerId(customerName);
                    const { data: existing } = yield dbClient
                        .from('customers')
                        .select('id')
                        .eq('customer_id_display', customerIdDisplay)
                        .single();
                    if (!existing) {
                        isUnique = true;
                    }
                    else {
                        attempts++;
                    }
                }
                if (!isUnique) {
                    // Fallback: add timestamp
                    customerIdDisplay = generateCustomerId(customerName) + Date.now().toString().slice(-2);
                }
            }
            // Generate magic code if missing
            if (!magicCode) {
                let attempts = 0;
                let isUnique = false;
                while (!isUnique && attempts < 10) {
                    magicCode = generateMagicCode();
                    const { data: existing } = yield dbClient
                        .from('customers')
                        .select('id')
                        .eq('magic_code', magicCode)
                        .single();
                    if (!existing) {
                        isUnique = true;
                    }
                    else {
                        attempts++;
                    }
                }
                if (!isUnique) {
                    throw new Error('Failed to generate unique magic code');
                }
            }
            // Update customer if needed
            if (!(customer === null || customer === void 0 ? void 0 : customer.customer_id_display) || !(customer === null || customer === void 0 ? void 0 : customer.magic_code)) {
                const { error: updateError } = yield dbClient
                    .from('customers')
                    .update({
                    customer_id_display: customerIdDisplay,
                    magic_code: magicCode,
                })
                    .eq('id', customerId);
                if (updateError) {
                    console.error('Error updating customer ID:', updateError);
                    throw updateError;
                }
            }
            return {
                customerIdDisplay: customerIdDisplay,
                magicCode: magicCode,
            };
        }
        catch (error) {
            console.error('Error ensuring customer ID:', error);
            throw error;
        }
    });
}
/**
 * Find customer by magic code
 */
function findCustomerByMagicCode(magicCode) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: customer, error } = yield dbClient
                .from('customers')
                .select('id, customer_id_display, first_name, last_name')
                .eq('magic_code', magicCode)
                .single();
            if (error || !customer) {
                return { customerId: null, customerIdDisplay: null, customerName: null };
            }
            const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || null;
            return {
                customerId: customer.id,
                customerIdDisplay: customer.customer_id_display || null,
                customerName,
            };
        }
        catch (error) {
            console.error('Error finding customer by magic code:', error);
            return { customerId: null, customerIdDisplay: null, customerName: null };
        }
    });
}
