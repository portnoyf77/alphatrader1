import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LocationData {
  city?: string;
  regionName?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  query?: string;
  status?: string;
}

const validateOptionalString = (val: unknown, maxLen: number): string | undefined => {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'string') return undefined;
  return val.slice(0, maxLen);
};

const validateOptionalNumber = (val: unknown, min: number, max: number): number | undefined => {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'number' || isNaN(val)) return undefined;
  return Math.max(min, Math.min(max, val));
};

const anonymizeIP = (ip: string): string => {
  if (!ip || ip === 'unknown') return 'unknown';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length > 4) {
    return ipv6Parts.slice(0, 4).join(':') + '::0';
  }
  return ip;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    if (!rawBody || typeof rawBody !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const data = rawBody as Record<string, unknown>;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle exit event
    if (data.is_exit === true) {
      const visit_id = validateOptionalString(data.visit_id, 100);
      const time_on_page = validateOptionalNumber(data.time_on_page, 0, 86400000);
      
      if (!visit_id) {
        return new Response(
          JSON.stringify({ error: 'Invalid input' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const { error } = await supabase
        .from('page_views')
        .update({
          time_on_page: time_on_page || 0,
          exited_at: new Date().toISOString(),
        })
        .eq('id', visit_id);

      if (error) {
        console.error('Error tracking page exit:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, visit_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate page_path
    const page_path = typeof data.page_path === 'string' && data.page_path.length > 0 && data.page_path.length <= 500
      ? data.page_path.slice(0, 500)
      : null;
    
    if (!page_path) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user_agent = validateOptionalString(data.user_agent, 1000);
    const referrer = validateOptionalString(data.referrer, 2000);
    const session_id = validateOptionalString(data.session_id, 100);

    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const rawIpAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const anonymizedIP = anonymizeIP(rawIpAddress);

    // Geolocation lookup
    let locationData: LocationData = {};
    if (rawIpAddress && rawIpAddress !== 'unknown') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${rawIpAddress}`);
        locationData = await geoResponse.json();
      } catch (geoError) {
        console.error('Error fetching geolocation');
      }
    }

    const insertResult = await supabase.from('page_views').insert({
      page_path,
      user_agent,
      referrer,
      session_id,
      ip_address: anonymizedIP,
      city: locationData.city || null,
      region: locationData.regionName || null,
      country: locationData.country || null,
      country_code: locationData.countryCode || null,
      timezone: locationData.timezone || null,
    }).select();

    if (insertResult.error) {
      console.error('Error tracking page view:', insertResult.error);
      throw insertResult.error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        location: locationData,
        visit_id: insertResult.data?.[0]?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-page-view function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
