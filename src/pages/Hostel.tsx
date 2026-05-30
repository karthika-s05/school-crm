import { useEffect, useState } from 'react';
import { Home, Users } from 'lucide-react';
import { api, type HostelRoom } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard, StatCard } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Hostel() {
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse>('/hostel').then((res) => {
      setRooms(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const byFloor = rooms.reduce<Record<number, HostelRoom[]>>((acc, r) => {
    if (!acc[r.floor]) acc[r.floor] = [];
    acc[r.floor].push(r);
    return acc;
  }, {});

  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.current_occupancy, 0);
  const available = totalCapacity - totalOccupied;

  if (loading) return <LoadingSpinner />;
  if (rooms.length === 0) return <EmptyState message="No hostel rooms configured" icon={Home} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Rooms" value={rooms.length} icon={Home} color="sky" />
        <StatCard title="Occupied" value={totalOccupied} icon={Users} color="amber" />
        <StatCard title="Available" value={available} icon={Home} color="emerald" />
      </div>

      {Object.entries(byFloor).map(([floor, floorRooms]) => (
        <SectionCard key={floor} title={`Floor ${floor}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {floorRooms.map(room => {
              const occupancyPct = Math.round((room.current_occupancy / room.capacity) * 100);
              return (
                <div key={room.id} className={`p-4 rounded-xl border-2 ${occupancyPct >= 100 ? 'border-rose-200 bg-rose-50' : occupancyPct > 50 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{room.room_number}</p>
                    <p className="text-xs text-gray-500">{room.room_type}</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <Users size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-600">{room.current_occupancy}/{room.capacity}</span>
                    </div>
                    <Badge variant={occupancyPct >= 100 ? 'danger' : 'success'} className="mt-2">{occupancyPct >= 100 ? 'Full' : 'Available'}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
