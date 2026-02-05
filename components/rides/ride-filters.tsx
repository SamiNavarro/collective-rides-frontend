/**
 * Ride Filters Component - Phase 3.3.1
 * 
 * MVP filters:
 * - Club (single select)
 * - Date preset (This week / Next 30 days / Custom)
 * - Search by title
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { RideFilters } from '@/lib/types/rides';
import { MyClubMembership } from '@/lib/types/clubs';

interface RideFiltersProps {
  clubs: MyClubMembership[];
  filters: RideFilters;
  onFiltersChange: (filters: RideFilters) => void;
}

export function RideFiltersComponent({ clubs, filters, onFiltersChange }: RideFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleClubChange = (value: string) => {
    onFiltersChange({
      ...filters,
      clubId: value === 'all' ? undefined : value,
    });
  };

  const handleDatePresetChange = (value: string) => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (value === 'this-week') {
      // This week (next 7 days)
      startDate = now.toISOString();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      endDate = weekEnd.toISOString();
    } else if (value === 'next-30-days') {
      // Next 30 days
      startDate = now.toISOString();
      const monthEnd = new Date(now);
      monthEnd.setDate(monthEnd.getDate() + 30);
      endDate = monthEnd.toISOString();
    }

    onFiltersChange({
      ...filters,
      datePreset: value as any,
      startDate,
      endDate,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onFiltersChange({
      ...filters,
      search: undefined,
    });
  };

  const activeClubs = clubs.filter(c => c.membershipStatus === 'active');

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search rides..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Club Filter */}
        <Select
          value={filters.clubId || 'all'}
          onValueChange={handleClubChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All clubs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clubs</SelectItem>
            {activeClubs.map((club) => (
              <SelectItem key={club.clubId} value={club.clubId}>
                {club.clubName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Preset Filter */}
        <Select
          value={filters.datePreset || 'next-30-days'}
          onValueChange={handleDatePresetChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This week</SelectItem>
            <SelectItem value="next-30-days">Next 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
