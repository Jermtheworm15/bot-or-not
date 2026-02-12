import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UsernameSetup() {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  
  const checkUsername = async (value) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }
    
    setIsChecking(true);
    try {
      const users = await base44.entities.User.filter({ username: value });
      setIsAvailable(users.length === 0);
    } catch (err) {
      console.error('Username check failed:', err);
    }
    setIsChecking(false);
  };
  
  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    
    // Debounce check
    if (value.length >= 3) {
      setTimeout(() => checkUsername(value), 500);
    } else {
      setIsAvailable(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    if (isAvailable === false) {
      toast.error('Username is already taken');
      return;
    }
    
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ username });
      toast.success('Username set successfully!');
      navigate(createPageUrl('Home'));
    } catch (err) {
      toast.error('Failed to save username');
    }
    setIsSaving(false);
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center py-12 px-4">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-zinc-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2 text-2xl">
              <User className="w-6 h-6 text-purple-400" />
              Choose Your Username
            </CardTitle>
            <p className="text-center text-zinc-400 text-sm mt-2">
              Pick a unique username for your Bot or Not profile
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="username"
                    className="bg-zinc-800 border-zinc-700 text-white pr-10"
                    maxLength={20}
                    autoFocus
                  />
                  {isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!isChecking && isAvailable === true && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                  {!isChecking && isAvailable === false && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                  )}
                </div>
                
                <div className="text-xs text-zinc-500">
                  {username.length < 3 && username.length > 0 && (
                    <span>At least 3 characters required</span>
                  )}
                  {isAvailable === true && (
                    <span className="text-green-400">✓ Username available!</span>
                  )}
                  {isAvailable === false && (
                    <span className="text-red-400">✗ Username already taken</span>
                  )}
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isSaving || !username || username.length < 3 || isAvailable === false}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? 'Saving...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}