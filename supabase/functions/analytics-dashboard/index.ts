import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all page views (service role bypasses RLS)
    const { data: pageViews, error } = await supabase
      .from('page_views')
      .select('*')
      .order('visited_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }

    const views = pageViews || [];

    // Aggregate stats
    const uniqueSessions = new Set(views.map(v => v.session_id).filter(Boolean));
    const totalPageviews = views.length;
    const totalVisitors = uniqueSessions.size;

    // Average time on page (only views with time_on_page > 0)
    const viewsWithTime = views.filter(v => v.time_on_page && v.time_on_page > 0);
    const avgTimeOnPage = viewsWithTime.length > 0
      ? Math.round(viewsWithTime.reduce((sum, v) => sum + (v.time_on_page || 0), 0) / viewsWithTime.length)
      : 0;

    // City breakdown
    const cityMap: Record<string, { count: number; region: string; country: string }> = {};
    views.forEach(v => {
      if (v.city) {
        const key = `${v.city}, ${v.region || ''}, ${v.country || ''}`;
        if (!cityMap[key]) cityMap[key] = { count: 0, region: v.region || '', country: v.country || '' };
        cityMap[key].count++;
      }
    });
    const cityBreakdown = Object.entries(cityMap)
      .map(([city, data]) => ({ city: city.split(',')[0], region: data.region, country: data.country, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // Country breakdown
    const countryMap: Record<string, number> = {};
    views.forEach(v => {
      if (v.country) {
        countryMap[v.country] = (countryMap[v.country] || 0) + 1;
      }
    });
    const countryBreakdown = Object.entries(countryMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Top pages
    const pageMap: Record<string, number> = {};
    views.forEach(v => {
      pageMap[v.page_path] = (pageMap[v.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageMap)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Device breakdown (simple UA parsing)
    let mobile = 0, desktop = 0, tablet = 0;
    views.forEach(v => {
      const ua = (v.user_agent || '').toLowerCase();
      if (/tablet|ipad/i.test(ua)) tablet++;
      else if (/mobile|android|iphone/i.test(ua)) mobile++;
      else desktop++;
    });

    // Recent views (last 20)
    const recentViews = views.slice(0, 20).map(v => ({
      id: v.id,
      page_path: v.page_path,
      city: v.city,
      region: v.region,
      country: v.country,
      visited_at: v.visited_at,
      time_on_page: v.time_on_page,
    }));

    return new Response(
      JSON.stringify({
        totalPageviews,
        totalVisitors,
        avgTimeOnPage,
        cityBreakdown,
        countryBreakdown,
        topPages,
        deviceBreakdown: { mobile, desktop, tablet },
        recentViews,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analytics-dashboard function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
