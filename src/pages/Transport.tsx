import { useEffect, useState } from 'react';
import { Bus, Phone, Users } from 'lucide-react';
import { api, type TransportRoute } from '../lib/supabase';
import { LoadingSpinner, EmptyState } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Transport() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse>('/transport').then((res) => {
      setRoutes(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (routes.length === 0) return <EmptyState message="No transport routes configured" icon={Bus} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {routes.map(route => (
          <div key={route.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center"><Bus size={22} className="text-amber-600" /></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{route.route_name}</h4>
                <p className="text-sm text-gray-500">{route.vehicle_number}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Users size={14} /> Driver: {route.driver_name}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} /> {route.driver_phone}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
