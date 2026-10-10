import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Users, PlusCircle, RotateCcw } from 'lucide-react';
import { CollegeEvent, EventCategory } from '../types';
import { api } from '../services/db';
import { EventCard } from '../components/events/EventCard';
import { RegistrationModal } from '../components/events/RegistrationModal';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const CATEGORIES: Array<'All' | EventCategory> = [
  'All',
  'Hackathon',
  'Tech',
  'Cultural',
  'Workshop',
  'Sports',
  'Academic',
  'Seminar'
];

export const EventsPage: React.FC = () => {
  const { role } = useAuth();
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'full'>('all');
  const [selectedEventForReg, setSelectedEventForReg] = useState<CollegeEvent | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    // Search filter
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.organizer_name && e.organizer_name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;

    // Status filter
    const remaining = (e.capacity || 1) - (e.registered_count || 0);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && remaining > 0 && e.status === 'published') ||
      (statusFilter === 'full' && remaining <= 0);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Organizer CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Campus Events & Competitions
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Discover workshops, hackathons, seminars, and fests happening across Atmiya University.
          </p>
        </div>

        {(role === 'organizer' || role === 'admin') && (
          <Link
            to="/organizer/create-event"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        )}
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, venue, topic, or organizer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Availability Filter */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl sm:flex sm:items-center sm:gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg text-center transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg text-center transition-all ${
                statusFilter === 'available' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('full')}
              className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg text-center transition-all ${
                statusFilter === 'full' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Booked
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegisterClick={(ev) => setSelectedEventForReg(ev)}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No events matched your filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or selecting a different category filter.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStatusFilter('all');
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Registration Modal */}
      <RegistrationModal
        event={selectedEventForReg}
        isOpen={!!selectedEventForReg}
        onClose={() => setSelectedEventForReg(null)}
        onSuccess={fetchEvents}
      />
    </div>
  );
};
