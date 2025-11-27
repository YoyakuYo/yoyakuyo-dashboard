// apps/api/src/routes/calendar.ts
// Google Calendar OAuth and event management routes

import { Router, Request, Response } from 'express';
import {
  getAuthorizationUrl,
  handleOAuthCallback,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/googleCalendarService';

const router = Router();

// GET /calendar/auth-url - Get Google Calendar authorization URL
router.get('/auth-url', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const authUrl = getAuthorizationUrl(userId);
    return res.json({ authUrl });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate authorization URL' });
  }
});

// GET /calendar/callback - Handle OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const userId = state as string;
    const result = await handleOAuthCallback(code as string, userId);

    if (result.success) {
      // Redirect to success page
      const frontendUrl = process.env.FRONTEND_URL || process.env.API_URL?.replace(':3000', ':3001') || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/my-shop?calendar=connected`);
    } else {
      return res.status(400).json({ error: result.error || 'Failed to complete authorization' });
    }
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    return res.status(500).json({ error: error.message || 'Failed to complete authorization' });
  }
});

// POST /calendar/events - Create a calendar event
router.post('/events', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { summary, description, start, end, location, attendees } = req.body;

    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'summary, start, and end are required' });
    }

    const result = await createCalendarEvent(userId, {
      summary,
      description,
      start,
      end,
      location,
      attendees,
    });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return res.status(500).json({ error: error.message || 'Failed to create calendar event' });
  }
});

// PATCH /calendar/events/:eventId - Update a calendar event
router.patch('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { eventId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { summary, description, start, end, location } = req.body;

    const result = await updateCalendarEvent(userId, eventId, {
      summary,
      description,
      start,
      end,
      location,
    });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return res.status(500).json({ error: error.message || 'Failed to update calendar event' });
  }
});

// DELETE /calendar/events/:eventId - Delete a calendar event
router.delete('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { eventId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const result = await deleteCalendarEvent(userId, eventId);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete calendar event' });
  }
});

export default router;

