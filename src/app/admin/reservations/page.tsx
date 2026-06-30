'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { formatDate, formatTime } from '@/lib/utils';
import type { Reservation, ReservationStatus } from '@/types';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Search,
  Table2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

function getStatusColor(status: ReservationStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 ring-blue-100';
    case 'seated':
      return 'bg-amber/10 text-amber ring-amber/20';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 ring-rose-100';
  }
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set('date', dateFilter);
      const res = await fetch(`/api/reservations?${params.toString()}`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  async function updateReservationStatus(id: string, status: ReservationStatus) {
    setUpdatingStatus(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setReservations((prev) =>
          prev.map((reservation) => (reservation.id === id ? data.reservation : reservation))
        );
        setSelectedReservation((prev) =>
          prev?.id === id ? data.reservation : prev
        );
      }
    } catch (error) {
      console.error('Failed to update reservation:', error);
    } finally {
      setUpdatingStatus(null);
    }
  }

  function getAvailableActions(status: ReservationStatus) {
    switch (status) {
      case 'confirmed':
        return [
          { label: 'Seat', newStatus: 'seated' as const, icon: UserCheck, className: 'bg-amber text-white hover:bg-amber-light' },
          { label: 'Cancel', newStatus: 'cancelled' as const, icon: XCircle, className: 'bg-rose-600 text-white hover:bg-rose-700' },
        ];
      case 'seated':
        return [
          { label: 'Complete', newStatus: 'completed' as const, icon: CheckCircle2, className: 'bg-emerald-600 text-white hover:bg-emerald-700' },
        ];
      default:
        return [];
    }
  }

  const filteredReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reservations;
    return reservations.filter((reservation) =>
      [reservation.customerName, reservation.phone, reservation.reference, reservation.tableNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [reservations, searchQuery]);

  const confirmed = filteredReservations.filter((reservation) => reservation.status === 'confirmed').length;
  const seated = filteredReservations.filter((reservation) => reservation.status === 'seated').length;
  const guests = filteredReservations
    .filter((reservation) => reservation.status !== 'cancelled')
    .reduce((sum, reservation) => sum + reservation.partySize, 0);
  const nextReservation = filteredReservations[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Reservations" description="Loading the dining room..." />
        <div className="h-96 animate-pulse rounded-[1.4rem] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Front of House"
        title="Reservations"
        description="Manage bookings, seating status, table assignment, and guest arrivals."
        action={
          <Badge className="rounded-full bg-slate-950 px-4 py-2 text-white">
            {filteredReservations.length} bookings
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Confirmed" value={confirmed} icon={CalendarDays} tone="blue" />
        <AdminStatCard label="Seated" value={seated} icon={UserCheck} tone="amber" />
        <AdminStatCard label="Expected Guests" value={guests} icon={Users} tone="green" />
        <AdminStatCard
          label="Next Booking"
          value={nextReservation ? formatTime(nextReservation.time) : 'None'}
          icon={Clock}
          tone="purple"
          helper={nextReservation?.customerName}
        />
      </div>

      <AdminPanel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search guest, phone, reference, or table"
              className="rounded-2xl border-slate-200 bg-white pl-10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Service Date
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-2xl border-slate-200 bg-white"
            />
          </div>
          {(dateFilter || searchQuery) && (
            <Button
              variant="ghost"
              className="rounded-2xl text-slate-500"
              onClick={() => {
                setDateFilter('');
                setSearchQuery('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </AdminPanel>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel title="Booking List" description="Click a reservation to inspect and manage the guest status.">
          {filteredReservations.length === 0 ? (
            <AdminEmptyState
              icon={CalendarDays}
              title="No reservations found"
              description="Try adjusting the date or search filters."
            />
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((reservation) => (
                <button
                  key={reservation.id}
                  onClick={() => setSelectedReservation(reservation)}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedReservation?.id === reservation.id
                      ? 'border-amber ring-2 ring-amber/15'
                      : 'border-slate-100'
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-950">{reservation.customerName}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          {reservation.reference}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{reservation.phone}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(reservation.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(reservation.time)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <Users className="h-3.5 w-3.5" />
                        {reservation.partySize}
                      </span>
                      <span className={`rounded-full px-3 py-1 font-semibold capitalize ring-1 ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="Guest Detail" description="Table context and available status actions.">
          {selectedReservation ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {selectedReservation.reference}
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  {selectedReservation.customerName}
                </h2>
                <p className="mt-1 text-sm text-white/55">{selectedReservation.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoTile icon={CalendarDays} label="Date" value={formatDate(selectedReservation.date)} />
                <InfoTile icon={Clock} label="Time" value={formatTime(selectedReservation.time)} />
                <InfoTile icon={Users} label="Party" value={`${selectedReservation.partySize} guests`} />
                <InfoTile icon={Table2} label="Table" value={selectedReservation.tableNumber ? `#${selectedReservation.tableNumber}` : 'Unassigned'} />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Status
                </p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ring-1 ${getStatusColor(selectedReservation.status)}`}>
                  {selectedReservation.status}
                </span>
              </div>

              {getAvailableActions(selectedReservation.status).length > 0 && (
                <div className="space-y-2">
                  {getAvailableActions(selectedReservation.status).map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.newStatus}
                        onClick={() => updateReservationStatus(selectedReservation.id, action.newStatus)}
                        disabled={updatingStatus === selectedReservation.id}
                        className={`w-full rounded-2xl ${action.className}`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {updatingStatus === selectedReservation.id ? 'Updating...' : action.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <AdminEmptyState
              icon={Table2}
              title="Select a booking"
              description="Reservation details and actions will appear here."
            />
          )}
        </AdminPanel>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="mt-3 text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
