import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export default function ImageSearchBar({ onSearch, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by tags, categories, or keywords..."
        className="pl-10 pr-10 bg-zinc-900 border-purple-500/30 text-white h-12"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}