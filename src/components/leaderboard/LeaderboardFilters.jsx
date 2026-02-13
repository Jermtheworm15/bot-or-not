import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export default function LeaderboardFilters({
  searchQuery,
  onSearchChange,
  timeframe,
  onTimeframeChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  gameMode,
  onGameModeChange,
  showGameMode = false,
  showTimeframe = true,
  sortOptions = []
}) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-zinc-900 border-zinc-700 text-white pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-3 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* View Mode Tabs */}
      {viewMode && (
        <Tabs value={viewMode} onValueChange={onViewModeChange}>
          <TabsList className="bg-zinc-900 border border-purple-500/30 w-full grid grid-cols-3">
            <TabsTrigger value="global" className="data-[state=active]:bg-purple-600">
              Global
            </TabsTrigger>
            <TabsTrigger value="friends" className="data-[state=active]:bg-purple-600">
              Friends
            </TabsTrigger>
            <TabsTrigger value="nearby" className="data-[state=active]:bg-purple-600">
              Nearby
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timeframe Filter */}
        {showTimeframe && timeframe !== undefined && (
          <Tabs value={timeframe} onValueChange={onTimeframeChange}>
            <TabsList className="bg-zinc-900 border border-purple-500/30 w-full grid grid-cols-3">
              <TabsTrigger value="all-time" className="data-[state=active]:bg-purple-600">
                All-Time
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-purple-600">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="daily" className="data-[state=active]:bg-purple-600">
                Daily
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Game Mode Filter */}
        {showGameMode && gameMode !== undefined && (
          <Select value={gameMode} onValueChange={onGameModeChange}>
            <SelectTrigger className="bg-zinc-900 border-purple-500/30">
              <SelectValue placeholder="All Game Modes" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-purple-500/30">
              <SelectItem value="all">All Game Modes</SelectItem>
              <SelectItem value="voting">Standard Voting</SelectItem>
              <SelectItem value="ai-battle">AI Battle</SelectItem>
              <SelectItem value="blitz">User Challenge</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sort Options */}
      {sortOptions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={sortBy === option.value ? 'default' : 'outline'}
              onClick={() => onSortChange(option.value)}
              className={sortBy === option.value ? 'bg-purple-600' : 'border-purple-500/30'}
            >
              {option.icon && <option.icon className="w-4 h-4 mr-2" />}
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}