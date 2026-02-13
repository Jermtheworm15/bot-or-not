import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertTriangle } from 'lucide-react';
import ImageAnalysis from '@/components/ImageAnalysis';

export default function ImageSearchResults({ images, onImageClick }) {
  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400 text-lg">No images found</p>
        <p className="text-zinc-500 text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-zinc-900 border-purple-500/30 overflow-hidden hover:border-purple-500/60 transition-all cursor-pointer group">
            <div onClick={() => onImageClick && onImageClick(image)}>
              {/* Image Preview */}
              <div className="relative aspect-square overflow-hidden bg-zinc-950">
                <img
                  src={image.url}
                  alt="Image"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {image.nsfw_flag && (
                  <div className="absolute top-2 right-2 bg-orange-500/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Flagged
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Image Info */}
              <div className="p-3 space-y-2">
                {/* Category Badge */}
                {image.ai_category && (
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                    {image.ai_category}
                  </Badge>
                )}

                {/* Tags */}
                {image.ai_tags && image.ai_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {image.ai_tags.slice(0, 3).map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {image.ai_tags.length > 3 && (
                      <Badge variant="outline" className="bg-zinc-800 text-zinc-500 border-zinc-700 text-xs">
                        +{image.ai_tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Uploader Info */}
                {image.user_uploaded && image.uploader_name && (
                  <p className="text-xs text-zinc-500">
                    By {image.uploader_name}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}