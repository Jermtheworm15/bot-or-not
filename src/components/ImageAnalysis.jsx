import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag, FolderOpen, AlertTriangle } from 'lucide-react';

export default function ImageAnalysis({ image }) {
  if (!image) return null;

  const hasTags = image.ai_tags && image.ai_tags.length > 0;
  const hasCategory = image.ai_category;
  const hasNSFW = image.nsfw_flag;

  if (!hasTags && !hasCategory && !hasNSFW) return null;

  return (
    <div className="space-y-3 bg-zinc-900/50 rounded-lg p-4 border border-purple-500/20">
      <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        AI Analysis
      </h3>

      {/* Category */}
      {hasCategory && (
        <div>
          <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            Category
          </p>
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
            {image.ai_category}
          </Badge>
        </div>
      )}

      {/* Tags */}
      {hasTags && (
        <div>
          <p className="text-xs text-zinc-400 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {image.ai_tags.map((tag, index) => (
              <Badge 
                key={index}
                variant="outline"
                className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* NSFW Warning */}
      {hasNSFW && (
        <div className="flex items-center gap-2 text-orange-400 text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>Flagged for review</span>
        </div>
      )}
    </div>
  );
}