import { useEffect, useState } from 'react';
import { Home, Users } from 'lucide-react';
import { supabase, type HostelRoom } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

export default function Hostel() {
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('hostel_rooms').select('*').order('room_number').then(({ data }) => {
      setRooms((data || []) as HostelRoom[]);
      setLoading(false);
    });
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
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms', value: rooms.length, color: 'bg-slate-50 text-slate-700' },
          { label: 'Total Capacity', value: totalCapacity, color: 'bg-sky-50 text-sky-700' },
          { label: 'Occupied', value: totalOccupied, color: 'bg-rose-50 text-rose-700' },
          { label: 'Available', value: available, color: 'bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-1 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rooms by floor */}
      {Object.entries(byFloor).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
        <SectionCard key={floor} title={`Floor ${floor}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {floorRooms.map(room => {
              const occupancyPct = room.capacity > 0 ? Math.round((room.current_occupancy / room.capacity) * 100) : 0;
              const isFull = room.current_occupancy >= room.capacity;
              const isEmpty = room.current_occupancy === 0;
              return (
                <div key={room.id} className={`p-4 rounded-xl border-2 transition-all ${
                  isFull ? 'border-rose-200 bg-rose-50' : isEmpty ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isFull ? 'bg-rose-200 text-rose-700' : isEmpty ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'
                    }`}>
                      <Home size={14} />
                    </div>
                    <Badge variant={isFull ? 'danger' : isEmpty ? 'success' : 'warning'}>
                      {isFull ? 'Full' : isEmpty ? 'Empty' : 'Partial'}
                    </Badge>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Room {room.room_number}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{room.room_type}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-600">{room.current_occupancy}/{room.capacity}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-500' : isEmpty ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">${room.monthly_fee}/mo</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
