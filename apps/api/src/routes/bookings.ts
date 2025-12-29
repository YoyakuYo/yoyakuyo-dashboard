import express, { Request, Response, Router } from 'express';
import { supabase } from '../lib/supabase';
import { createCustomerNotification, createOwnerNotification, getCustomerProfileId } from '../services/notificationService';

const router = Router();

// GET /bookings
router.get('/', async (req: Request, res: Response) => {
    try {
        // Get user_id from header (x-user-id) for filtering
        const userId = req.headers['x-user-id'] as string;
        
        let query = supabase
            .from('bookings')
            .select('id, shop_id, service_id, staff_id, customer_id, customer_profile_id, start_time, end_time, notes, status, customer_name, customer_email, customer_phone, shops(name), services(name), staff(first_name, last_name)');
        
        // If user_id provided, filter by shops owned by user
        if (userId) {
            // First get shop IDs owned by this user
            const { data: userShops, error: shopsError } = await supabase
                .from('shops')
                .select('id')
                .eq('owner_user_id', userId);
            
            if (shopsError) {
                console.error('Error fetching user shops:', shopsError);
                return res.status(200).json([]);
            }
            
            if (!userShops || userShops.length === 0) {
                // User owns no shops, return empty array
                return res.status(200).json([]);
            }
            
            const shopIds = userShops.map(shop => shop.id);
            query = query.in('shop_id', shopIds);
        }
        
        const { data: bookings, error } = await query;

        if (error) {
            console.error('Error fetching bookings:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            // Return empty array to prevent frontend .map() errors
            return res.status(200).json([]);
        }

        // Ensure we always return an array
        if (!Array.isArray(bookings)) {
            console.error('Bookings data is not an array:', typeof bookings, bookings);
            return res.status(200).json([]);
        }

        // Transform to standardized shape with date/time extracted
        const standardizedBookings = bookings.map((booking: any) => {
            const startDate = booking.start_time ? new Date(booking.start_time) : null;
            const endDate = booking.end_time ? new Date(booking.end_time) : null;
            
            return {
                id: booking.id || '',
                shop_id: booking.shop_id || '',
                service_id: booking.service_id || '',
                staff_id: booking.staff_id || '',
                customer_id: booking.customer_id || '',
                customer_name: booking.customer_name || null,
                customer_email: booking.customer_email || null,
                customer_phone: booking.customer_phone || null,
                date: startDate ? startDate.toISOString().split('T')[0] : '',
                time: startDate ? startDate.toTimeString().split(' ')[0].substring(0, 5) : '',
                start_time: booking.start_time || '',
                end_time: booking.end_time || '',
                notes: booking.notes || '',
                status: booking.status || 'pending',
                // Keep nested objects for backward compatibility
                shops: booking.shops || null,
                services: booking.services || null,
                staff: booking.staff || null
            };
        });

        return res.status(200).json(standardizedBookings);
    } catch (error: any) {
        console.error('Error during bookings retrieval:', error);
        console.error('Error stack:', error.stack);
        // Return empty array to prevent frontend crashes
        return res.status(200).json([]);
    }
});

// POST /bookings
router.post('/', async (req: Request, res: Response) => {
    try {
        const { 
            service_id, 
            staff_id, 
            start_time, 
            end_time, 
            notes, 
            shop_id, 
            customer_id,  // Optional: for owner-created bookings
            customer_name,  // Required for public bookings
            customer_email,  // Required for public bookings
            customer_phone,  // Optional
            first_name,  // Legacy support
            last_name,  // Legacy support
            phone,  // Legacy support
            email,  // Legacy support
            channel, // New: distinguish 'guest', 'line', 'web'
            guest_name,
            guest_email,
            line_user_id // New: support for line
        } = req.body;

        // Get user_id from header (for logged-in customers)
        const userId = req.headers['x-user-id'] as string;

        // Get customer_profile_id if user is logged in - auto-create if it doesn't exist
        let customerProfileId: string | null = null;
        if (userId) {
            // Try to find customer profile by customer_auth_id
            let { data: profile, error: profileError } = await supabase
                .from("customer_profiles")
                .select("id")
                .eq("customer_auth_id", userId)
                .maybeSingle();

            if (profile?.id) {
                customerProfileId = profile.id;
            } else {
                // Fallback: check if customer_profiles.id = user.id (old structure)
                const { data: profileFallback } = await supabase
                    .from("customer_profiles")
                    .select("id")
                    .eq("id", userId)
                    .maybeSingle();
                
                if (profileFallback?.id) {
                    customerProfileId = profileFallback.id;
                } else {
                    // Auto-create customer profile if it doesn't exist
                    try {
                        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
                        const userEmail = authUser?.user?.email || '';
                        const userName = authUser?.user?.user_metadata?.name || authUser?.user?.email?.split('@')[0] || 'Customer';
                        
                        const { data: profileId, error: createError } = await supabase
                            .rpc('create_customer_profile', {
                                p_customer_auth_id: userId,
                                p_email: userEmail,
                                p_name: userName,
                                p_phone: null
                            });

                        if (createError || !profileId) {
                            console.error('[Booking] Error creating customer profile:', createError);
                            // Don't fail the booking, just log the error
                        } else {
                            // Fetch the newly created profile
                            const { data: newProfile } = await supabase
                                .from("customer_profiles")
                                .select("id")
                                .eq("id", profileId)
                                .single();

                            if (newProfile?.id) {
                                customerProfileId = newProfile.id;
                                console.log('[Booking] ✅ Auto-created customer profile:', customerProfileId);
                            }
                        }
                    } catch (createErr: any) {
                        console.error('[Booking] Error auto-creating customer profile:', createErr);
                        // Don't fail the booking, just log the error
                    }
                }
            }
        }

        // Support both new format (customer_name) and legacy (first_name)
        const finalCustomerName = customer_name || first_name || '';

        // Validate required fields for public bookings
        if (!customer_id && !finalCustomerName) {
            return res.status(400).json({ 
                error: 'customer_name is required (or customer_id for owner bookings)' 
            });
        }

        // Verify shop is verified (required for all bookings)
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, is_verified')
            .eq('id', shop_id)
            .maybeSingle();

        if (shopError) {
            console.error('Error checking shop verification:', shopError);
            return res.status(500).json({ error: 'Failed to verify shop' });
        }

        if (!shop?.is_verified) {
            return res.status(403).json({ error: 'This shop is not verified for bookings' });
        }

        // Create the booking - use customer_name directly
        // customer_id is optional (can be null for public/guest bookings)
        // customer_email and customer_phone are required for guest bookings
        // --- Data Model Logic Strict Enforcement ---
        const bookingData: any = {
            service_id,
            staff_id: staff_id || null,
            start_time,
            end_time,
            notes: notes || null,
            shop_id,
            status: 'pending',
        };

        if (channel === 'line') {
            bookingData.channel = 'line';
            bookingData.line_user_id = line_user_id || null; // Only set if line
            bookingData.customer_name = customer_name || null;
            bookingData.customer_email = customer_email || null;
            bookingData.user_id = null;
            bookingData.guest_name = null;
            bookingData.guest_email = null;
        } else if (userId && channel === 'web') {
            bookingData.channel = 'web';
            bookingData.user_id = userId;
            bookingData.customer_profile_id = customerProfileId || null;
            bookingData.customer_name = customer_name || null;
            bookingData.customer_email = customer_email || null;
            bookingData.line_user_id = null;
            bookingData.guest_name = null;
            bookingData.guest_email = null;
        } else if (channel === 'guest') {
            bookingData.channel = 'guest';
            bookingData.guest_name = guest_name || customer_name || null;
            bookingData.guest_email = guest_email || customer_email || null;
            bookingData.customer_name = null;
            bookingData.customer_email = null;
            bookingData.line_user_id = null;
            bookingData.user_id = null;
            bookingData.customer_profile_id = null;
        }
        // Optionally add customer_id if known for owner-created
        if (customer_id) bookingData.customer_id = customer_id;
        if (customer_phone || phone) bookingData.customer_phone = customer_phone || phone;


        const { data: newBooking, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select('*, shops(name, owner_user_id), services(name), customer_profile_id, customer_id')
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            return res.status(500).json({ error: error.message });
        }

        // Log guest booking information for debugging
        if (!userId) {
            console.log('[GUEST BOOKING] ✅ Created guest booking:', {
                booking_id: newBooking.id,
                booking_source: 'guest',
                user_id: null,
                guest_email: newBooking.customer_email,
                guest_name: newBooking.customer_name,
                shop_id: newBooking.shop_id,
                service_id: newBooking.service_id,
            });
        }

        // Create notification for owner when customer creates booking
        if (newBooking?.shop_id) {
            const shop = newBooking.shops as any;
            const service = newBooking.services as any;
            
            if (shop?.owner_user_id) {
                const shopName = shop.name || 'your shop';
                const serviceName = service?.name || 'a service';
                const bookingDate = newBooking.start_time 
                    ? new Date(newBooking.start_time).toLocaleDateString()
                    : 'N/A';
                const bookingTime = newBooking.start_time 
                    ? new Date(newBooking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
                
                await createOwnerNotification(
                    shop.owner_user_id,
                    'new_booking',
                    'New Booking Request',
                    `New booking request for ${serviceName} on ${bookingDate} at ${bookingTime} from ${newBooking.customer_name || 'a customer'}`,
                    {
                        booking_id: newBooking.id,
                        shop_id: newBooking.shop_id,
                        customer_name: newBooking.customer_name,
                        service_name: serviceName,
                        date: bookingDate,
                        time: bookingTime
                    }
                );
            }
        }

        // Create chat thread automatically for this booking
        if (newBooking?.id && newBooking?.shop_id) {
            try {
                // Check if thread already exists
                const { data: existingThread } = await supabase
                    .from('shop_threads')
                    .select('id')
                    .eq('booking_id', newBooking.id)
                    .eq('shop_id', newBooking.shop_id)
                    .maybeSingle();

                if (!existingThread) {
                    // Get customer_profile_id if customer_id exists
                    let customerProfileId = newBooking.customer_profile_id;
                    if (!customerProfileId && newBooking.customer_id) {
                        customerProfileId = await getCustomerProfileId(newBooking.customer_id);
                    }

                    // Use customer_profile_id as customer_id in shop_threads
                    // (customer_id in shop_threads stores customer_profile.id)
                    const threadCustomerId = customerProfileId || newBooking.customer_id || null;

                    // Create new thread for this booking
                    await supabase
                        .from('shop_threads')
                        .insert({
                            shop_id: newBooking.shop_id,
                            booking_id: newBooking.id,
                            customer_id: threadCustomerId,
                            customer_email: newBooking.customer_email || null,
                        });
                }
            } catch (threadError) {
                console.error('Error creating chat thread:', threadError);
                // Don't fail booking creation if thread creation fails
            }
        }

        return res.status(201).json(newBooking ?? { message: 'Booking created' });
    } catch (error: any) {
        console.error('Error during booking creation:', error);
        return res.status(500).json({ error: error.message });
    }
});

// GET /bookings/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*, shops(*), services(*), staff(*), availability(*)')
            .eq('id', id)
            .single();

        if (bookingError) {
            console.error('Error fetching booking:', bookingError);
            return res.status(404).json({ error: bookingError.message });
        }

        return res.json(booking);
    } catch (error: any) {
        console.error('Error during booking retrieval:', error);
        return res.status(500).json({ error: error.message });
    }
});

// PATCH /bookings/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;
        const { status } = req.body;
        const userId = req.headers['x-user-id'] as string;

        // Validate status
        if (!status || !['confirmed', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "confirmed" or "rejected"' });
        }

        // First, get the existing booking to check ownership
        const { data: existingBooking, error: fetchError } = await supabase
            .from('bookings')
            .select('shop_id')
            .eq('id', bookingId)
            .single();

        if (fetchError || !existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Verify user owns the shop that this booking belongs to
        if (userId) {
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .select('owner_user_id')
                .eq('id', existingBooking.shop_id)
                .single();
            
            if (shopError || !shop) {
                return res.status(404).json({ error: 'Shop not found' });
            }
            
            if (shop.owner_user_id !== userId) {
                return res.status(403).json({ error: 'You do not own this shop' });
            }
        }

        // Get booking details before updating (for notification)
        const { data: bookingBeforeUpdate } = await supabase
            .from('bookings')
            .select(`
                customer_profile_id,
                customer_id,
                customer_name,
                start_time,
                date,
                time_slot,
                services:service_id (name),
                shops:shop_id (name)
            `)
            .eq('id', bookingId)
            .single();

        // Update the booking status
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', bookingId)
            .select('*')
            .single();

        if (updateError) {
            console.error('Error updating booking status:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        // Create notification for customer when owner confirms/rejects/cancels
        if (bookingBeforeUpdate && (status === 'confirmed' || status === 'rejected' || status === 'cancelled')) {
            const shopName = (bookingBeforeUpdate.shops as any)?.name || 'the shop';
            const serviceName = (bookingBeforeUpdate.services as any)?.name || 'service';
            const date = bookingBeforeUpdate.date || (bookingBeforeUpdate.start_time 
                ? new Date(bookingBeforeUpdate.start_time).toLocaleDateString()
                : 'N/A');
            const time = bookingBeforeUpdate.start_time 
                ? new Date(bookingBeforeUpdate.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : bookingBeforeUpdate.time_slot || 'N/A';

            // Get customer_profile_id (support both customer_profile_id and customer_id)
            let customerProfileId = bookingBeforeUpdate.customer_profile_id;
            if (!customerProfileId && bookingBeforeUpdate.customer_id) {
                customerProfileId = await getCustomerProfileId(bookingBeforeUpdate.customer_id);
            }

            if (customerProfileId) {
                let title = '';
                let body = '';

                if (status === 'confirmed') {
                    title = 'Booking Confirmed';
                    body = `Your booking for ${serviceName} at ${shopName} on ${date} at ${time} has been confirmed!`;
                } else if (status === 'cancelled') {
                    title = 'Booking Cancelled';
                    body = `Your booking for ${serviceName} at ${shopName} on ${date} has been cancelled.`;
                } else if (status === 'rejected') {
                    title = 'Booking Rejected';
                    body = `Your booking request for ${serviceName} at ${shopName} on ${date} has been rejected.`;
                }

                if (title && body) {
                    await createCustomerNotification(
                        customerProfileId,
                        'booking_update',
                        title,
                        body,
                        { booking_id: bookingId, status: status, shop_name: shopName, service_name: serviceName, date: date, time: time }
                    );
                }
            }
        }

        return res.json(updatedBooking);
    } catch (err: any) {
        console.error('Server error updating booking status:', err);
        return res.status(500).json({ error: 'Server error updating booking status' });
    }
});

// POST /bookings/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // First, get the existing booking to check ownership and status
        const { data: existingBooking, error: fetchError } = await supabase
            .from('bookings')
            .select('shop_id, status')
            .eq('id', bookingId)
            .single();

        if (fetchError || !existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if booking is already cancelled or completed
        if (existingBooking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }
        if (existingBooking.status === 'completed') {
            return res.status(400).json({ error: 'Cannot cancel a completed booking' });
        }

        // Verify user owns the shop that this booking belongs to
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('owner_user_id')
            .eq('id', existingBooking.shop_id)
            .single();
        
        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        
        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: 'You do not own this shop' });
        }

        // Get booking details before updating (for notification)
        const { data: bookingBeforeUpdate } = await supabase
            .from('bookings')
            .select(`
                customer_profile_id,
                customer_id,
                customer_name,
                start_time,
                date,
                time_slot,
                services:service_id (name),
                shops:shop_id (name)
            `)
            .eq('id', bookingId)
            .single();

        // Update the booking status to cancelled
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error cancelling booking:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        // Create notification for customer
        if (bookingBeforeUpdate) {
            const shopName = (bookingBeforeUpdate.shops as any)?.name || 'the shop';
            const serviceName = (bookingBeforeUpdate.services as any)?.name || 'service';
            const date = bookingBeforeUpdate.date || (bookingBeforeUpdate.start_time 
                ? new Date(bookingBeforeUpdate.start_time).toLocaleDateString()
                : 'N/A');
            const time = bookingBeforeUpdate.start_time 
                ? new Date(bookingBeforeUpdate.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : bookingBeforeUpdate.time_slot || 'N/A';

            // Get customer_profile_id
            let customerProfileId = bookingBeforeUpdate.customer_profile_id;
            if (!customerProfileId && bookingBeforeUpdate.customer_id) {
                customerProfileId = await getCustomerProfileId(bookingBeforeUpdate.customer_id);
            }

            if (customerProfileId) {
                await createCustomerNotification(
                    customerProfileId,
                    'booking_update',
                    'Booking Cancelled',
                    `Your booking for ${serviceName} at ${shopName} on ${date} has been cancelled.`,
                    { booking_id: bookingId, status: 'cancelled', shop_name: shopName, service_name: serviceName, date: date, time: time }
                );
            }
        }

        // Send instant message to customer about cancellation (multilingual)
        try {
            // Find thread associated with this booking
            const { data: thread } = await supabase
                .from('shop_threads')
                .select('id, customer_email')
                .eq('booking_id', bookingId)
                .eq('shop_id', existingBooking.shop_id)
                .single();

            if (thread) {
                // Send cancellation message (multilingual - detect customer language from thread)
                const { generateMultilingualResponse } = require('../services/multilingualService');
                const { getCustomerLanguage } = require('../services/customerService');
                
                const customerLang = thread?.customer_email 
                    ? await getCustomerLanguage(thread.customer_email)
                    : 'en'; // Default to English if no email
                
                const cancellationMessage = await generateMultilingualResponse('booking_cancelled', customerLang);
                
                await supabase
                    .from('shop_messages')
                    .insert([{
                        thread_id: thread.id,
                        sender_type: 'ai',
                        content: cancellationMessage,
                        read_by_owner: true,
                        read_by_customer: false,
                    }]);
            }
        } catch (messageError) {
            console.error('Error sending cancellation message:', messageError);
            // Don't fail the cancellation if message fails
        }

        return res.json({ success: true });
    } catch (err: any) {
        console.error('Server error cancelling booking:', err);
        return res.status(500).json({ error: 'Server error cancelling booking' });
    }
});

// POST /bookings/:id/reschedule
router.post('/:id/reschedule', async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;
        const { date_time } = req.body;
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Validate date_time
        if (!date_time) {
            return res.status(400).json({ error: 'date_time is required' });
        }

        const newDateTime = new Date(date_time);
        if (isNaN(newDateTime.getTime())) {
            return res.status(400).json({ error: 'Invalid date_time format' });
        }

        // First, get the existing booking to check ownership and status
        const { data: existingBooking, error: fetchError } = await supabase
            .from('bookings')
            .select('shop_id, status, start_time, end_time, service_id')
            .eq('id', bookingId)
            .single();

        if (fetchError || !existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if booking is already cancelled or completed
        if (existingBooking.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot reschedule a cancelled booking' });
        }
        if (existingBooking.status === 'completed') {
            return res.status(400).json({ error: 'Cannot reschedule a completed booking' });
        }

        // Verify user owns the shop that this booking belongs to
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('owner_user_id')
            .eq('id', existingBooking.shop_id)
            .single();
        
        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        
        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: 'You do not own this shop' });
        }

        // Calculate end_time based on service duration
        let endTime = new Date(newDateTime);
        if (existingBooking.service_id) {
            const { data: service } = await supabase
                .from('services')
                .select('duration_minutes, duration')
                .eq('id', existingBooking.service_id)
                .single();
            
            if (service) {
                const durationMinutes = service.duration_minutes || service.duration || 60;
                endTime = new Date(newDateTime.getTime() + durationMinutes * 60000);
            } else {
                // Default to 60 minutes if service not found
                endTime = new Date(newDateTime.getTime() + 60 * 60000);
            }
        } else {
            // Default to 60 minutes if no service
            endTime = new Date(newDateTime.getTime() + 60 * 60000);
        }

        // Get booking details before updating (for notification)
        const { data: bookingBeforeUpdate } = await supabase
            .from('bookings')
            .select(`
                customer_profile_id,
                customer_id,
                customer_name,
                services:service_id (name),
                shops:shop_id (name)
            `)
            .eq('id', bookingId)
            .single();

        // Update the booking start_time and end_time
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ 
                start_time: newDateTime.toISOString(),
                end_time: endTime.toISOString()
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error rescheduling booking:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        // Create notification for customer
        if (bookingBeforeUpdate) {
            const shopName = (bookingBeforeUpdate.shops as any)?.name || 'the shop';
            const serviceName = (bookingBeforeUpdate.services as any)?.name || 'service';
            const newDate = newDateTime.toLocaleDateString();
            const newTime = newDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Get customer_profile_id
            let customerProfileId = bookingBeforeUpdate.customer_profile_id;
            if (!customerProfileId && bookingBeforeUpdate.customer_id) {
                customerProfileId = await getCustomerProfileId(bookingBeforeUpdate.customer_id);
            }

            if (customerProfileId) {
                await createCustomerNotification(
                    customerProfileId,
                    'booking_update',
                    'Booking Rescheduled',
                    `Your booking for ${serviceName} at ${shopName} has been rescheduled to ${newDate} at ${newTime}.`,
                    { booking_id: bookingId, status: 'rescheduled', shop_name: shopName, service_name: serviceName, date: newDate, time: newTime }
                );
            }
        }

        return res.json({ success: true });
    } catch (err: any) {
        console.error('Server error rescheduling booking:', err);
        return res.status(500).json({ error: 'Server error rescheduling booking' });
    }
});

// PATCH /bookings/:id - Update booking (status, start_time, end_time, etc.)
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;
        const { status, start_time, end_time } = req.body;
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // First, get the existing booking to check ownership
        const { data: existingBooking, error: fetchError } = await supabase
            .from('bookings')
            .select('shop_id, status')
            .eq('id', bookingId)
            .single();

        if (fetchError || !existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Verify user owns the shop that this booking belongs to
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('owner_user_id')
            .eq('id', existingBooking.shop_id)
            .single();
        
        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        
        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: 'You do not own this shop' });
        }

        // Build update object
        const updateData: any = {};
        
        if (status !== undefined) {
            // Validate status
            const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            }
            updateData.status = status;
        }

        if (start_time !== undefined) {
            const startDate = new Date(start_time);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ error: 'Invalid start_time format' });
            }
            updateData.start_time = startDate.toISOString();
        }

        if (end_time !== undefined) {
            const endDate = new Date(end_time);
            if (isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Invalid end_time format' });
            }
            updateData.end_time = endDate.toISOString();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Get booking details before updating (for notification if status changed)
        let bookingBeforeUpdate: any = null;
        if (status !== undefined) {
            const { data } = await supabase
                .from('bookings')
                .select(`
                    customer_profile_id,
                    customer_id,
                    customer_name,
                    start_time,
                    date,
                    time_slot,
                    services:service_id (name),
                    shops:shop_id (name)
                `)
                .eq('id', bookingId)
                .single();
            bookingBeforeUpdate = data;
        }

        // Update the booking
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select('*')
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        // Create notification for customer when status changes
        if (status !== undefined && bookingBeforeUpdate && (status === 'confirmed' || status === 'rejected' || status === 'cancelled')) {
            const shopName = (bookingBeforeUpdate.shops as any)?.name || 'the shop';
            const serviceName = (bookingBeforeUpdate.services as any)?.name || 'service';
            const date = bookingBeforeUpdate.date || (bookingBeforeUpdate.start_time 
                ? new Date(bookingBeforeUpdate.start_time).toLocaleDateString()
                : 'N/A');
            const time = bookingBeforeUpdate.start_time 
                ? new Date(bookingBeforeUpdate.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : bookingBeforeUpdate.time_slot || 'N/A';

            // Get customer_profile_id
            let customerProfileId = bookingBeforeUpdate.customer_profile_id;
            if (!customerProfileId && bookingBeforeUpdate.customer_id) {
                customerProfileId = await getCustomerProfileId(bookingBeforeUpdate.customer_id);
            }

            if (customerProfileId) {
                let title = '';
                let body = '';

                if (status === 'confirmed') {
                    title = 'Booking Confirmed';
                    body = `Your booking for ${serviceName} at ${shopName} on ${date} at ${time} has been confirmed!`;
                } else if (status === 'cancelled') {
                    title = 'Booking Cancelled';
                    body = `Your booking for ${serviceName} at ${shopName} on ${date} has been cancelled.`;
                } else if (status === 'rejected') {
                    title = 'Booking Rejected';
                    body = `Your booking request for ${serviceName} at ${shopName} on ${date} has been rejected.`;
                }

                if (title && body) {
                    await createCustomerNotification(
                        customerProfileId,
                        'booking_update',
                        title,
                        body,
                        { booking_id: bookingId, status: status, shop_name: shopName, service_name: serviceName, date: date, time: time }
                    );
                }
            }
        }

        return res.json(updatedBooking);
    } catch (err: any) {
        console.error('Server error updating booking:', err);
        return res.status(500).json({ error: 'Server error updating booking' });
    }
});

// DELETE /bookings/:id - Delete/cancel a booking
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // First, get the existing booking to check ownership
        const { data: existingBooking, error: fetchError } = await supabase
            .from('bookings')
            .select('shop_id, status')
            .eq('id', bookingId)
            .single();

        if (fetchError || !existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Verify user owns the shop that this booking belongs to
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('owner_user_id')
            .eq('id', existingBooking.shop_id)
            .single();
        
        if (shopError || !shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        
        if (shop.owner_user_id !== userId) {
            return res.status(403).json({ error: 'You do not own this shop' });
        }

        // Update status to cancelled instead of deleting (soft delete)
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error cancelling booking:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        return res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (err: any) {
        console.error('Server error deleting booking:', err);
        return res.status(500).json({ error: 'Server error deleting booking' });
    }
});

export default router;