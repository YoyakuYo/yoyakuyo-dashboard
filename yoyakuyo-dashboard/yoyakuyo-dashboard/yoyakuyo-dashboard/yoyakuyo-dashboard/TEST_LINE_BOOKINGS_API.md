# Test LINE Bookings API

## Quick Test Steps

1. **Check API URL** - Open browser console in LINE app and check:
   ```javascript
   console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
   ```

2. **Test API Directly** - In browser console, run:
   ```javascript
   fetch('YOUR_API_URL/api/line/bookings?line_user_id=Uf5741397f874c9a5822578e506f0cb47')
     .then(r => r.json())
     .then(data => console.log('API Response:', data))
     .catch(err => console.error('API Error:', err));
   ```

3. **Check Server Logs** - When you refresh the bookings page, check your API server logs for:
   - `[LINE Bookings] Fetching bookings for line_user_id: ...`
   - `[LINE Bookings] Query result: X bookings found`
   - `[LINE Bookings] ⚠️ Primary query returned 0 results, using user_id fallback immediately`
   - `[LINE Bookings] ✅ Fallback query found X bookings`

## Common Issues

1. **API URL pointing to production** - If `NEXT_PUBLIC_API_URL` is set to Render/production, it might not have the latest code
2. **CORS error** - Check browser console for CORS errors
3. **Network error** - Check if API server is running
4. **Response format** - API should return an array, not an object

## Expected API Response

```json
[
  {
    "id": "...",
    "booking_type": "line",
    "user_id": "0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547",
    "line_user_id": "Uf5741397f874c9a5822578e506f0cb47",
    "customer_name": "Alpha",
    "status": "pending",
    "created_at": "2025-12-15T08:17:10.336Z",
    "shops": { "name": "...", "address": "..." },
    "services": { "name": "...", "price": 1000 }
  }
]
```

