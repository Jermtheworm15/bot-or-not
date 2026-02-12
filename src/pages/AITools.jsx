import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, FileText, Settings } from 'lucide-react';
import ContentIdeaGenerator from '@/components/ai/ContentIdeaGenerator';
import ArticleGenerator from '@/components/ai/ArticleGenerator';
import MetadataGenerator from '@/components/ai/MetadataGenerator';

export default function AITools() {
  const [activeTab, setActiveTab] = useState('ideas');

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-black mb-2">AI Content Tools</h1>
          <p className="text-zinc-400">Generate ideas, articles, and metadata to enhance your Bot or Not content</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Content Generation Suite</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                  <TabsTrigger value="ideas" className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span className="hidden sm:inline">Ideas</span>
                  </TabsTrigger>
                  <TabsTrigger value="articles" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Articles</span>
                  </TabsTrigger>
                  <TabsTrigger value="metadata" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Metadata</span>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="ideas" className="space-y-6">
                    <div className="bg-zinc-800/50 border border-purple-500/20 rounded-lg p-4 mb-4">
                      <p className="text-sm text-zinc-300">
                        Get creative content ideas tailored to the Bot or Not theme. Perfect for planning your next upload!
                      </p>
                    </div>
                    <ContentIdeaGenerator />
                  </TabsContent>

                  <TabsContent value="articles" className="space-y-6">
                    <div className="bg-zinc-800/50 border border-purple-500/20 rounded-lg p-4 mb-4">
                      <p className="text-sm text-zinc-300">
                        Generate comprehensive blog articles and educational content about AI detection and bots.
                      </p>
                    </div>
                    <ArticleGenerator />
                  </TabsContent>

                  <TabsContent value="metadata" className="space-y-6">
                    <div className="bg-zinc-800/50 border border-purple-500/20 rounded-lg p-4 mb-4">
                      <p className="text-sm text-zinc-300">
                        Auto-generate SEO-optimized titles, descriptions, keywords, and URL slugs for your content.
                      </p>
                    </div>
                    <MetadataGenerator />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}