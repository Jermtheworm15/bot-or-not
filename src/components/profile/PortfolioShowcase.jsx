import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink, X } from 'lucide-react';

export default function PortfolioShowcase({ userEmail, isOwnProfile }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link: '',
    category: 'project'
  });

  React.useEffect(() => {
    loadPortfolio();
  }, [userEmail]);

  const loadPortfolio = async () => {
    try {
      const portfolio = await base44.entities.PortfolioItem.filter({ user_email: userEmail });
      setItems(portfolio);
    } catch (err) {
      console.error('Error loading portfolio:', err);
    }
    setIsLoading(false);
  };

  const handleAddItem = async () => {
    if (!formData.title.trim()) return;

    try {
      await base44.entities.PortfolioItem.create({
        user_email: userEmail,
        ...formData
      });
      setFormData({ title: '', description: '', image_url: '', link: '', category: 'project' });
      setShowForm(false);
      await loadPortfolio();
    } catch (err) {
      console.error('Error adding portfolio item:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.PortfolioItem.delete(id);
      await loadPortfolio();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  if (isLoading) {
    return <div className="text-zinc-400">Loading portfolio...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-zinc-900 border-purple-500/30">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Portfolio</CardTitle>
          {isOwnProfile && (
            <Button
              onClick={() => setShowForm(!showForm)}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-purple-500/30 rounded-lg p-4 space-y-3 bg-zinc-800/50"
              >
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-purple-500"
                  rows="2"
                />
                <input
                  type="url"
                  placeholder="Image URL (optional)"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <input
                  type="url"
                  placeholder="Link (optional)"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="project">Project</option>
                  <option value="artwork">Artwork</option>
                  <option value="achievement">Achievement</option>
                  <option value="publication">Publication</option>
                  <option value="other">Other</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={handleAddItem} className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm">
                    Add Item
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="border-zinc-700 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {items.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">
              {isOwnProfile ? 'Add your first portfolio item!' : 'No portfolio items yet'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden hover:border-purple-500/50 transition-all"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      {isOwnProfile && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-purple-400 mb-2 capitalize">{item.category}</p>
                    {item.description && (
                      <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{item.description}</p>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}