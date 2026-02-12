import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Flame, Trophy, Award, Upload } from 'lucide-react';
import moment from 'moment';

export default function ProfileActivityFeed({ userEmail }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [userEmail]);

  const loadActivities = async () => {
    try {
      const userActivities = await base44.entities.Activity.filter(
        { user_email: userEmail },
        '-created_date',
        20
      );
      setActivities(userActivities);
    } catch (err) {
      console.error('Error loading activities:', err);
    }
    setIsLoading(false);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'vote':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'streak':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'level_up':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'badge_earned':
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'upload':
        return <Upload className="w-4 h-4 text-green-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (isLoading) {
    return <div className="text-zinc-400">Loading activity...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-zinc-900 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-3 pb-3 border-b border-zinc-800 last:border-0"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-2">
                      {activity.description}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {moment(activity.created_date).fromNow()}
                    </p>
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