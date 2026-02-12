import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LibraryCard from '@/components/libraries/LibraryCard';
import LibraryGrid from '@/components/libraries/LibraryGrid';
import LibrarySearchFilter from '@/components/libraries/LibrarySearchFilter';

const AI_LIBRARIES = [
  {
    id: 'dalle',
    name: 'DALL-E Collections',
    description: 'Advanced imagery from OpenAI\'s DALL-E',
    fullDescription: 'Explore stunning images created with OpenAI\'s DALL-E technology. Known for detailed, coherent AI art across various styles.',
    icon: '🎨',
    preview: [
      'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=300',
      'https://images.unsplash.com/photo-1677386435075-c3a841e46bb3?w=300',
      'https://images.unsplash.com/photo-1686191124888-caf32f1260b0?w=300',
    ],
    count: 50,
    images: [
      { url: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=600', title: 'Digital Landscape' },
      { url: 'https://images.unsplash.com/photo-1677386435075-c3a841e46bb3?w=600', title: 'Abstract Art' },
      { url: 'https://images.unsplash.com/photo-1686191124888-caf32f1260b0?w=600', title: 'Synthetic Faces' },
      { url: 'https://images.unsplash.com/photo-1578926314433-d66d100db4e3?w=600', title: 'Modern Design' },
      { url: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=600', title: 'Creative Blend' },
      { url: 'https://images.unsplash.com/photo-1677386435075-c3a841e46bb3?w=600', title: 'Artistic Vision' },
      { url: 'https://images.unsplash.com/photo-1686191124888-caf32f1260b0?w=600', title: 'Digital Portrait' },
      { url: 'https://images.unsplash.com/photo-1578926314433-d66d100db4e3?w=600', title: 'Conceptual Art' },
    ]
  },
  {
    id: 'midjourney',
    name: 'Midjourney Creations',
    description: 'High-quality AI art from Midjourney',
    fullDescription: 'Discover artistic masterpieces from Midjourney. Renowned for cinematic quality and exceptional detail in AI-generated imagery.',
    icon: '✨',
    preview: [
      'https://images.unsplash.com/photo-1577720643272-265eb28ed5e9?w=300',
      'https://images.unsplash.com/photo-1577720632346-b7ba4701f990?w=300',
      'https://images.unsplash.com/photo-1577720643272-265eb28ed5e9?w=300',
    ],
    count: 48,
    images: [
      { url: 'https://images.unsplash.com/photo-1577720643272-265eb28ed5e9?w=600', title: 'Cinematic Scene' },
      { url: 'https://images.unsplash.com/photo-1577720632346-b7ba4701f990?w=600', title: 'Fantasy Realm' },
      { url: 'https://images.unsplash.com/photo-1577720643272-265eb28ed5e9?w=600', title: 'Photorealistic' },
      { url: 'https://images.unsplash.com/photo-1577720632346-b7ba4701f990?w=600', title: 'Epic Composition' },
      { url: 'https://images.unsplash.com/photo-1577720643272-265eb28ed5e9?w=600', title: 'Detailed World' },
      { url: 'https://images.unsplash.com/photo-1577720632346-b7ba4701f990?w=600', title: 'Artistic Style' },
      { url: 'https://images.unsplash.com/photo-1577720643272-265eb28ed5e9?w=600', title: 'Creative Vision' },
      { url: 'https://images.unsplash.com/photo-1577720632346-b7ba4701f990?w=600', title: 'Masterpiece' },
    ]
  },
  {
    id: 'stable',
    name: 'Stable Diffusion Gallery',
    description: 'Diverse creations from Stable Diffusion',
    fullDescription: 'Browse diverse and accessible AI art from Stable Diffusion. Known for versatility across art styles and imaginative concepts.',
    icon: '🌟',
    preview: [
      'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=300',
      'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=300',
      'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=300',
    ],
    count: 72,
    images: [
      { url: 'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=600', title: 'Surreal Art' },
      { url: 'https://images.unsplash.com/photo-1549887534-b91e07c2897f?w=600', title: 'Abstract Forms' },
      { url: 'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=600', title: 'Experimental' },
      { url: 'https://images.unsplash.com/photo-1549887534-b91e07c2897f?w=600', title: 'Varied Styles' },
      { url: 'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=600', title: 'Creative Output' },
      { url: 'https://images.unsplash.com/photo-1549887534-b91e07c2897f?w=600', title: 'Imaginative' },
      { url: 'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=600', title: 'Artistic Freedom' },
      { url: 'https://images.unsplash.com/photo-1549887534-b91e07c2897f?w=600', title: 'Diverse Visions' },
    ]
  },
  {
    id: 'synthetics',
    name: 'Synthetic Faces',
    description: 'AI-generated human faces collection',
    fullDescription: 'Explore the uncanny valley of AI-generated faces. Perfect for testing your bot detection skills with ultra-realistic features.',
    icon: '👤',
    preview: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    ],
    count: 95,
    images: [
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', title: 'Portrait 1' },
      { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', title: 'Portrait 2' },
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', title: 'Portrait 3' },
      { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', title: 'Portrait 4' },
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', title: 'Portrait 5' },
      { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', title: 'Portrait 6' },
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', title: 'Portrait 7' },
      { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', title: 'Portrait 8' },
    ]
  },
  {
    id: 'styles',
    name: 'Art Styles & Techniques',
    description: 'AI art grouped by visual style',
    fullDescription: 'Curated collections organized by artistic style. From pixel art to hyper-realism, explore the breadth of AI creativity.',
    icon: '🎭',
    preview: [
      'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=300',
      'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=300',
      'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=300',
    ],
    count: 60,
    images: [
      { url: 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600', title: 'Oil Painting' },
      { url: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=600', title: 'Watercolor' },
      { url: 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600', title: 'Pencil Sketch' },
      { url: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=600', title: 'Digital Art' },
      { url: 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600', title: 'Neon Style' },
      { url: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=600', title: 'Pixel Art' },
      { url: 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600', title: 'Comic Book' },
      { url: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=600', title: 'Photography Style' },
    ]
  },
];

export default function AIImageLibraries() {
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [filters, setFilters] = useState({ search: '', tags: [], style: '', model: '' });
  const [allImages, setAllImages] = useState([]);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    loadAllImages();
  }, []);

  const loadAllImages = async () => {
    try {
      const images = await base44.entities.Image.list();
      setAllImages(images);

      // Extract all unique tags
      const tagSet = new Set();
      images.forEach(img => {
        if (img.tags) {
          img.tags.forEach(tag => tagSet.add(tag));
        }
      });
      setAllTags(Array.from(tagSet));
    } catch (err) {
      console.error('Error loading images:', err);
    }
  };

  const filteredImages = allImages.filter(img => {
    if (filters.search && !img.url.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.style && img.style !== filters.style) return false;
    if (filters.model && img.ai_model !== filters.model) return false;
    if (filters.tags.length > 0) {
      return filters.tags.some(tag => img.tags?.includes(tag));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8 pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {!selectedLibrary ? (
            <motion.div
              key="libraries"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  <h1 className="text-4xl font-black">AI Image Libraries</h1>
                </div>
                <p className="text-zinc-400">Browse curated collections of AI-generated images organized by tool and style</p>

                {/* Discovery Button */}
                <Link
                  to={createPageUrl('PersonalizedDiscovery')}
                  className="inline-flex items-center gap-2 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Personalized Discovery
                </Link>
              </motion.div>

              {/* Search & Filter */}
              <LibrarySearchFilter
                onFiltersChange={setFilters}
                tags={allTags}
              />

              {/* Custom Image Grid (if filters applied) */}
              {filters.search || filters.tags.length > 0 || filters.style || filters.model ? (
                <>
                  <h2 className="text-2xl font-bold mb-4">Search Results ({filteredImages.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredImages.length > 0 ? (
                      filteredImages.map(image => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative overflow-hidden rounded-lg aspect-square cursor-pointer"
                        >
                          <img
                            src={image.url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-end justify-end p-3">
                            <div className="flex flex-wrap gap-1 justify-end">
                              {image.tags?.slice(0, 3).map(tag => (
                                <span key={tag} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="col-span-full text-center text-zinc-400">No images match your filters.</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Libraries Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AI_LIBRARIES.map((library) => (
                      <LibraryCard
                        key={library.id}
                        library={library}
                        onSelect={setSelectedLibrary}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LibraryGrid
                library={selectedLibrary}
                onBack={() => setSelectedLibrary(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}