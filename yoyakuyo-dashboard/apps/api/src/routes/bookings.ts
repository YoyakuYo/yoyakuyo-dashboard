import express, { Request, Response, Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /bookings
router.get('/', async (req: Request, res: Response) => {
    try {
        // Get user_id from header (x-user-id) for filtering
        const userId = req.headers['x-user-id'] as string;
        
        let query = supabase
            .from('bookings')
            .select('id, shop_id, service_id, staff_id, customer_id, start_time, end_time, notes, status, customer_name, customer_email, customer_phone, shops(name), services(name), staff(first_name, last_name)');
        
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
            email  // Legacy support
        } = req.body;

        // Support both new format (customer_name) and legacy (first_name)
        const finalCustomerName = customer_name || first_name || '';

        // Validate required fields for public bookings
        if (!customer_id && !finalCustomerName) {
            return res.status(400).json({ 
                error: 'customer_name is required (or customer_id for owner bookings)' 
            });
        }

        // Create the booking - use customer_name directly
        // customer_id is optional (can be null for public bookings)
        // NO email or phone - only name + permanent ID system
        const bookingData: any = {
            service_id,
            staff_id: staff_id || null,
            start_time,
            end_time,
            notes: notes || null,
            shop_id,
            customer_id: customer_id || null,  // Optional
            customer_name: finalCustomerName,
            customer_email: null,  // Removed - not required
            customer_phone: null,  // Removed - not required
            status: 'pending',
        };

        const { data: newBooking, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select('*');

        if (error) {
            console.error('Error creating booking:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(newBooking?.[0] ?? { message: 'Booking created' });
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

        // Update the booking status to cancelled
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error cancelling booking:', updateError);
            return res.status(500).json({ error: updateError.message });
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