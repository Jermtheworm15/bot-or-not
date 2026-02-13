import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Briefcase, GraduationCap } from 'lucide-react';

export default function DemographicsForm({ profile, onSave }) {
  const [formData, setFormData] = useState({
    age: profile?.age || '',
    sex: profile?.sex || '',
    location: profile?.location || '',
    university: profile?.university || '',
    employment: profile?.employment || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-zinc-900 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Age */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Age (Optional)</label>
            <input
              type="number"
              min="13"
              max="120"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value ? Number(e.target.value) : '')}
              placeholder="Your age"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Sex */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Gender (Optional)</label>
            <Select value={formData.sex} onValueChange={(value) => handleChange('sex', value)}>
              <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location (Optional)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, State or Country"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              University (Optional)
            </label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => handleChange('university', e.target.value)}
              placeholder="School/University name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Employment */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Current Employment (Optional)
            </label>
            <input
              type="text"
              value={formData.employment}
              onChange={(e) => handleChange('employment', e.target.value)}
              placeholder="Job title or company"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? 'Saving...' : 'Save Demographics'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}