import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { zip_code, radius_miles = 25, limit = 20 } = body;

    if (!zip_code) {
      return Response.json({ error: 'zip_code is required' }, { status: 400 });
    }

    // Fetch all user profiles with coordinates
    const allProfiles = await base44.asServiceRole.entities.UserProfile.list();
    
    // Get current user's profile to find their coordinates from zip code
    const userProfiles = allProfiles.filter(p => p.user_email === user.email);
    const userProfile = userProfiles.length > 0 ? userProfiles[0] : null;

    // If user provided a specific zip code, we need to convert it to coordinates
    // For now, filter by users who have set the same zip code or nearby
    const nearbyUsers = allProfiles.filter(profile => {
      if (profile.user_email === user.email) return false;
      if (!profile.zip_code) return false;
      
      // Simple zip code distance calculation
      // In production, use a proper zip code distance API
      const userZip = zip_code.substring(0, 3);
      const profileZip = profile.zip_code.substring(0, 3);
      
      // If using coordinates, calculate haversine distance
      if (profile.latitude && profile.longitude && userProfile?.latitude && userProfile?.longitude) {
        const distance = haversineDistance(
          userProfile.latitude,
          userProfile.longitude,
          profile.latitude,
          profile.longitude
        );
        return distance <= radius_miles;
      }
      
      // Fallback: same first 3 digits of zip code (rough approximation)
      return userZip === profileZip;
    }).sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, limit);

    return Response.json({ users: nearbyUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Haversine formula to calculate distance between two coordinates in miles
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}