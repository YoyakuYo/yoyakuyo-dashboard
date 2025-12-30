// apps/api/src/services/customerService.ts
// Service for customer identification, history tracking, and personalization

import { supabaseAdmin, supabase } from '../lib/supabase';
import { detectLanguage } from './languageDetectionService';
import { ensureCustomerId } from './customerIdService';

const dbClient = supabaseAdmin || supabase;

export interface CustomerHistory {
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  previousBookings: Array<{
    id: string;
    serviceName?: string;
    date: string;
    status: string;
  }>;
  previousConversations: number;
  lastInteraction?: string;
  isReturning: boolean;
}

/**
 * Finds or creates a customer record based on email
 * Auto-detects and saves customer language from first message
 */
export async function findOrCreateCustomer(
  email: string,
  name?: string,
  phone?: string,
  firstMessage?: string // Optional: first message to detect language
): Promise<{ customerId: string | null; isNew: boolean }> {
  try {
    if (!email) {
      return { customerId: null, isNew: false };
    }

    // Try to find existing customer by email
    const { data: existingCustomer, error: findError } = await dbClient
      .from('customers')
      .select('id, preferred_language')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingCustomer) {
      // If customer exists but has no preferred_language and we have a first message, detect and save it
      if (!existingCustomer.preferred_language && firstMessage) {
        const detectedLanguage = await detectLanguage(firstMessage);
        await dbClient
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
      let preferredLanguage: string | null = null;
      if (firstMessage) {
        preferredLanguage = await detectLanguage(firstMessage);
        console.log(`[CustomerService] Auto-detected language ${preferredLanguage} for new customer`);
      }

      const { data: newCustomer, error: createError } = await dbClient
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
      if (newCustomer?.id) {
        try {
          await ensureCustomerId(newCustomer.id, name);
        } catch (idError) {
          console.error('Error generating customer ID:', idError);
          // Continue even if ID generation fails
        }
      }

      return { customerId: newCustomer?.id || null, isNew: true };
    }

    return { customerId: null, isNew: false };
  } catch (error: any) {
    console.error('Error in findOrCreateCustomer:', error);
    return { customerId: null, isNew: false };
  }
}

/**
 * Get customer's preferred language (or detect from message if not set)
 */
export async function getCustomerLanguage(
  customerEmail?: string | null,
  customerId?: string | null,
  fallbackMessage?: string
): Promise<string> {
  try {
    if (customerId) {
      const { data: customer } = await dbClient
        .from('customers')
        .select('preferred_language')
        .eq('id', customerId)
        .single();
      
      if (customer?.preferred_language) {
        return customer.preferred_language;
      }
    }
    
    if (customerEmail) {
      const { data: customer } = await dbClient
        .from('customers')
        .select('preferred_language')
        .eq('email', customerEmail.toLowerCase().trim())
        .single();
      
      if (customer?.preferred_language) {
        return customer.preferred_language;
      }
    }
    
    // Fallback: detect from message if provided
    if (fallbackMessage) {
      return await detectLanguage(fallbackMessage);
    }
    
    return 'en'; // Default to English
  } catch (error: any) {
    console.error('Error getting customer language:', error);
    return fallbackMessage ? await detectLanguage(fallbackMessage) : 'en';
  }
}

/**
 * Update customer's preferred language
 */
export async function updateCustomerLanguage(
  customerEmail: string,
  languageCode: string
): Promise<boolean> {
  try {
    const { error } = await dbClient
      .from('customers')
      .update({ preferred_language: languageCode })
      .eq('email', customerEmail.toLowerCase().trim());
    
    if (error) {
      console.error('Error updating customer language:', error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error updating customer language:', error);
    return false;
  }
}

/**
 * Gets customer history for personalization
 */
export async function getCustomerHistory(
  shopId: string,
  customerEmail?: string | null,
  customerId?: string | null
): Promise<CustomerHistory> {
  try {
    const history: CustomerHistory = {
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
    } else if (customerEmail) {
      customerQuery = customerQuery.eq('email', customerEmail.toLowerCase().trim());
    }

    const { data: customer, error: customerError } = await customerQuery.single();

    if (customerError || !customer) {
      return history;
    }

    history.customerId = customer.id;
    history.customerName = customer.first_name || null;
    history.customerEmail = customer.email || null;

    // Get previous bookings for this shop
    const { data: bookings, error: bookingsError } = await dbClient
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
      history.previousBookings = bookings.map((b: any) => ({
        id: b.id,
        serviceName: b.services?.name || null,
        date: b.start_time,
        status: b.status,
      }));

      if (history.previousBookings.length > 0) {
        history.isReturning = true;
        history.lastInteraction = history.previousBookings[0].date;
      }
    }

    // Count previous conversations (threads)
    const { data: threads, error: threadsError } = await dbClient
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
  } catch (error: any) {
    console.error('Error in getCustomerHistory:', error);
    return {
      previousBookings: [],
      previousConversations: 0,
      isReturning: false,
    };
  }
}

/**
 * Generates personalized greeting for returning customers (fully multilingual)
 */
export async function generatePersonalizedGreeting(
  history: CustomerHistory,
  languageCode: string = 'en'
): Promise<string> {
  const { generateMultilingualResponse } = await import('./multilingualService');
  
  if (!history.isReturning || !history.customerName) {
    return await generateMultilingualResponse('what_can_i_help', languageCode);
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
    const welcomeMsg = await generateMultilingualResponse('welcome_back', languageCode, { name });
    return `${welcomeMsg} How was your ${lastService} on ${dateStr}? ${await generateMultilingualResponse('what_can_i_help', languageCode)}`;
  }

  const welcomeMsg = await generateMultilingualResponse('welcome_back', languageCode, { name });
  return `${welcomeMsg} ${await generateMultilingualResponse('what_can_i_help', languageCode)}`;
}

