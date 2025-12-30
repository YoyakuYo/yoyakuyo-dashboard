// apps/api/src/services/customerIdService.ts
// Service for generating permanent customer IDs (Mario X44 format) and magic codes

import { supabaseAdmin, supabase } from '../lib/supabase';

const dbClient = supabaseAdmin || supabase;

/**
 * Generate a permanent customer ID in format: Name LetterNumber (e.g., Mario X44, Yuki K9)
 */
export function generateCustomerId(name: string): string {
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
export function generateMagicCode(): string {
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
export async function ensureCustomerId(
  customerId: string,
  customerName: string
): Promise<{ customerIdDisplay: string; magicCode: string }> {
  try {
    // Get current customer
    const { data: customer, error: fetchError } = await dbClient
      .from('customers')
      .select('customer_id_display, magic_code')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      throw fetchError;
    }

    let customerIdDisplay = customer?.customer_id_display;
    let magicCode = customer?.magic_code;

    // Generate ID if missing
    if (!customerIdDisplay) {
      let attempts = 0;
      let isUnique = false;
      
      while (!isUnique && attempts < 10) {
        customerIdDisplay = generateCustomerId(customerName);
        const { data: existing } = await dbClient
          .from('customers')
          .select('id')
          .eq('customer_id_display', customerIdDisplay)
          .single();
        
        if (!existing) {
          isUnique = true;
        } else {
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
        const { data: existing } = await dbClient
          .from('customers')
          .select('id')
          .eq('magic_code', magicCode)
          .single();
        
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
        }
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique magic code');
      }
    }

    // Update customer if needed
    if (!customer?.customer_id_display || !customer?.magic_code) {
      const { error: updateError } = await dbClient
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
      customerIdDisplay: customerIdDisplay!,
      magicCode: magicCode!,
    };
  } catch (error: any) {
    console.error('Error ensuring customer ID:', error);
    throw error;
  }
}

/**
 * Find customer by magic code
 */
export async function findCustomerByMagicCode(magicCode: string): Promise<{
  customerId: string | null;
  customerIdDisplay: string | null;
  customerName: string | null;
}> {
  try {
    const { data: customer, error } = await dbClient
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
  } catch (error: any) {
    console.error('Error finding customer by magic code:', error);
    return { customerId: null, customerIdDisplay: null, customerName: null };
  }
}

