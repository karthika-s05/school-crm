import { useEffect, useState } from 'react';
import { Bus, MapPin, Phone, Users } from 'lucide-react';
import { supabase, type TransportRoute } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

export default function Transport() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('transport_routes').select('*').order('route_name').then(({ data }) => {
      setRoutes((data || []) as TransportRoute[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (routes.length === 0) return <EmptyState message="No transport routes configured" icon={Bus} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {routes.map(route => (
          <div key={route.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bus size={22} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{route.route_name}</h3>
                  <Badge variant="info">{route.vehicle_number}</Badge>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400" />
                    <span>Capacity: {route.capacity} seats</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <span>{route.driver_name} · {route.driver_phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Route Stops</p>
              <div className="flex flex-wrap gap-2">
                {(route.stops || []).map((stop, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                    <MapPin size={10} />
                    <span>{stop}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="Transport Overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-700">{routes.length}</p>
            <p className="text-xs text-amber-600 mt-1">Total Routes</p>
          </div>
          <div className="bg-sky-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-sky-700">{routes.reduce((s, r) => s + r.capacity, 0)}</p>
            <p className="text-xs text-sky-600 mt-1">Total Capacity</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-700">{routes.length}</p>
            <p className="text-xs text-emerald-600 mt-1">Active Buses</p>
          </div>
          <div className="bg-teal-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-teal-700">{routes.reduce((s, r) => s + (r.stops?.length || 0), 0)}</p>
            <p className="text-xs text-teal-600 mt-1">Total Stops</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
