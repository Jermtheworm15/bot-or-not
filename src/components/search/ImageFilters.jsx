import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

export default function ImageFilters({ filters, onFilterChange, onClearFilters }) {
  const hasActiveFilters = filters.category || filters.source || filters.dateRange || filters.nsfw !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Category Filter */}
        <Select value={filters.category || 'all'} onValueChange={(v) => onFilterChange('category', v === 'all' ? null : v)}>
          <SelectTrigger className="bg-zinc-900 border-purple-500/30">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="portrait">Portrait</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
            <SelectItem value="abstract">Abstract</SelectItem>
            <SelectItem value="object">Object</SelectItem>
            <SelectItem value="animal">Animal</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="art">Art</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Source Filter */}
        <Select value={filters.source || 'all'} onValueChange={(v) => onFilterChange('source', v === 'all' ? null : v)}>
          <SelectTrigger className="bg-zinc-900 border-purple-500/30">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="user-upload">User Uploads</SelectItem>
            <SelectItem value="ai-generated">AI Generated</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select value={filters.dateRange || 'all'} onValueChange={(v) => onFilterChange('dateRange', v === 'all' ? null : v)}>
          <SelectTrigger className="bg-zinc-900 border-purple-500/30">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        {/* NSFW Filter */}
        <Select value={filters.nsfw || 'all'} onValueChange={(v) => onFilterChange('nsfw', v)}>
          <SelectTrigger className="bg-zinc-900 border-purple-500/30">
            <SelectValue placeholder="Content" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="safe">Safe Only</SelectItem>
            <SelectItem value="flagged">Flagged Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="outline" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              {filters.category}
            </Badge>
          )}
          {filters.source && (
            <Badge variant="outline" className="bg-green-600/20 text-green-300 border-green-500/30">
              {filters.source}
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
              {filters.dateRange}
            </Badge>
          )}
          {filters.nsfw !== 'all' && (
            <Badge variant="outline" className="bg-orange-600/20 text-orange-300 border-orange-500/30">
              {filters.nsfw === 'safe' ? 'Safe Only' : 'Flagged Only'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}