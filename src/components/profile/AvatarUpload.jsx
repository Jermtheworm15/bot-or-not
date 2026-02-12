import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AvatarUpload({ currentAvatar, onAvatarChange, userName }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({ avatar_url: file_url });
      onAvatarChange(file_url);
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error('Failed to upload avatar');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative"
    >
      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden shadow-lg">
        {currentAvatar ? (
          <img 
            src={currentAvatar} 
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-12 h-12 text-white" />
        )}
        
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
          <Upload className="w-5 h-5 text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>
      {isUploading && (
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" />
      )}
    </motion.div>
  );
}