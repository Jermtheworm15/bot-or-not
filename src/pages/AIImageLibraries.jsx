import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';
import LibraryCard from '@/components/libraries/LibraryCard';
import LibraryGrid from '@/components/libraries/LibraryGrid';

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
              </motion.div>

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