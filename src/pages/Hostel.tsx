import { useEffect, useState } from 'react';
import { Home, Users, DoorOpen, BedDouble } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, SectionCard, StatCard, Badge, LoadingSpinner, EmptyState, Card
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Hostel() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse>('/hostel')
      .then((res) => setRooms(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byFloor = rooms.reduce<Record<number, any[]>>((acc, r) => {
    if (!acc[r.floor]) acc[r.floor] = [];
    acc[r.floor].push(r);
    return acc;
  }, {});

  const totalCapacity = rooms.reduce((s, r) => s + (r.capacity || 0), 0);
  const totalOccupied = rooms.reduce((s, r) => s + (r.current_occupancy || 0), 0);
  const available = totalCapacity - totalOccupied;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel"
        subtitle="Manage hostel rooms and occupancy"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Rooms"
          value={rooms.length}
          subtitle="All rooms"
          icon={DoorOpen}
          color="sky"
        />
        <StatCard
          title="Total Beds"
          value={totalCapacity}
          subtitle="Total capacity"
          icon={BedDouble}
          color="amber"
        />
        <StatCard
          title="Occupied"
          value={totalOccupied}
          subtitle="Students hosted"
          icon={Users}
          color="rose"
        />
        <StatCard
          title="Available"
          value={available}
          subtitle="Beds available"
          icon={Home}
          color="emerald"
        />
      </div>

      {rooms.length === 0 ? (
        <EmptyState message="No hostel rooms configured" icon={Home} />
      ) : (
        Object.entries(byFloor)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([floor, floorRooms]) => (
            <SectionCard key={floor} title={`Floor ${floor}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {floorRooms.sort((a, b) => a.room_number.localeCompare(b.room_number)).map(room => {
                  const occupancyPct = Math.round(((room.current_occupancy || 0) / (room.capacity || 1)) * 100);
                  const isFull = occupancyPct >= 100;
                  const isHigh = occupancyPct > 50;

                  return (
                    <Card
                      key={room.id}
                      className={`p-4 text-center ${
                        isFull ? 'border-rose-200 bg-rose-50' :
                        isHigh ? 'border-amber-200 bg-amber-50' :
                        'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <p className="text-lg font-bold text-gray-800">{room.room_number}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{room.room_type || 'Standard'}</p>

                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Users size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {room.current_occupancy || 0}/{room.capacity || 0}
                        </span>
                      </div>

                      <Badge
                        variant={isFull ? 'danger' : 'success'}
                        className="mt-3"
                      >
                        {isFull ? 'Full' : `${room.capacity - room.current_occupancy} Available`}
                      </Badge>
                    </Card>
                  );
                })}
              </div>
            </SectionCard>
          ))
      )}
    </div>
  );
}
