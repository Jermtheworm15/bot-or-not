import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function BioEditor({ bio, onSave }) {
  const [content, setContent] = useState(bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(content);
    setIsEditing(false);
    setIsSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-zinc-900 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            About You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              {content ? (
                <div 
                  className="prose prose-invert max-w-none text-sm text-zinc-300 prose-p:my-2 prose-headings:my-3"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="text-zinc-500 italic">No bio yet. Add one to tell others about yourself!</p>
              )}
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
              >
                Edit Bio
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <ReactQuill
                value={content}
                onChange={setContent}
                theme="snow"
                className="bg-zinc-800 rounded text-white"
                modules={{
                  toolbar: [
                    [{ header: [2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? 'Saving...' : 'Save Bio'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setContent(bio || '');
                  }}
                  variant="outline"
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}