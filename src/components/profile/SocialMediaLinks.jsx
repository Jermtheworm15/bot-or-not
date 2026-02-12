import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Twitter, Instagram, Youtube, Linkedin, Github, Facebook, Music } from 'lucide-react';
import { toast } from 'sonner';

const SOCIAL_PLATFORMS = [
  { key: 'twitter', name: 'Twitter/X', icon: Twitter, placeholder: '@username or URL' },
  { key: 'instagram', name: 'Instagram', icon: Instagram, placeholder: '@username or URL' },
  { key: 'tiktok', name: 'TikTok', icon: Music, placeholder: '@username or URL' },
  { key: 'youtube', name: 'YouTube', icon: Youtube, placeholder: 'Channel URL' },
  { key: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'Profile URL' },
  { key: 'github', name: 'GitHub', icon: Github, placeholder: '@username or URL' },
  { key: 'facebook', name: 'Facebook', icon: Facebook, placeholder: 'Profile URL' }
];

export default function SocialMediaLinks({ userProfile, onUpdate }) {
  const [links, setLinks] = useState({
    twitter: userProfile?.twitter || '',
    instagram: userProfile?.instagram || '',
    tiktok: userProfile?.tiktok || '',
    youtube: userProfile?.youtube || '',
    linkedin: userProfile?.linkedin || '',
    github: userProfile?.github || '',
    facebook: userProfile?.facebook || ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempLinks, setTempLinks] = useState(links);

  const handleChange = (key, value) => {
    setTempLinks(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData = {};
      Object.keys(tempLinks).forEach(key => {
        if (tempLinks[key] !== links[key]) {
          updateData[key] = tempLinks[key];
        }
      });

      if (Object.keys(updateData).length > 0) {
        await base44.entities.UserProfile.update(userProfile.id, updateData);
        setLinks(tempLinks);
        onUpdate();
        toast.success('Social media links updated!');
      }
      
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update links');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempLinks(links);
    setIsEditing(false);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Social Media Links</CardTitle>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="text-green-400 border-green-400/30 hover:bg-green-400/10"
          >
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {SOCIAL_PLATFORMS.map(platform => {
                const Icon = platform.icon;
                const value = links[platform.key];
                
                return (
                  <div key={platform.key} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-green-400" />
                    {value ? (
                      <a
                        href={value.startsWith('http') ? value : `https://${platform.key}.com/${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 underline text-sm truncate"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-zinc-500 text-sm">Not added</span>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {SOCIAL_PLATFORMS.map(platform => {
                const Icon = platform.icon;
                
                return (
                  <div key={platform.key} className="space-y-2">
                    <Label className="flex items-center gap-2 text-zinc-300">
                      <Icon className="w-4 h-4" />
                      {platform.name}
                    </Label>
                    <Input
                      value={tempLinks[platform.key]}
                      onChange={(e) => handleChange(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                );
              })}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? 'Saving...' : 'Save Links'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}