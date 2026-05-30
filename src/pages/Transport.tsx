import { useEffect, useState } from 'react';
import { Bus, MapPin, Phone, Users, Navigation } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, StatCard, LoadingSpinner, EmptyState, Card
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Transport() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse>('/transport')
      .then((res) => setRoutes(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCapacity = routes.reduce((s, r) => s + (r.capacity || 0), 0);
  const totalRoutes = routes.length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transport"
        subtitle="Manage school bus routes and vehicles"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Routes"
          value={totalRoutes}
          subtitle="Active routes"
          icon={Navigation}
          color="sky"
        />
        <StatCard
          title="Total Capacity"
          value={totalCapacity}
          subtitle="Seats available"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Drivers"
          value={routes.length}
          subtitle="Active drivers"
          icon={Bus}
          color="amber"
        />
      </div>

      {routes.length === 0 ? (
        <EmptyState message="No transport routes configured" icon={Bus} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {routes.map(route => (
            <Card key={route.id} className="p-5" hover>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Bus size={26} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base">{route.route_name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{route.vehicle_number}</p>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-50 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span className="font-medium">{route.driver_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{route.driver_phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{route.capacity || 0} seats</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
