import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload as UploadIcon, CheckCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ContentEnhancementPanel from '@/components/ai/ContentEnhancementPanel';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploaderName, setUploaderName] = useState('');
  const [isBot, setIsBot] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiEnhancements, setAiEnhancements] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setUploadError(null);
    
    if (!file) {
      toast.error('Please select an image');
      return;
    }
    
    if (!uploaderName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!agreedToTerms) {
      toast.error('You must agree to the terms');
      return;
    }

    setIsUploading(true);
    console.log('[Upload UI] Starting upload process...');

    try {
      console.log('[Upload UI] Starting direct upload to storage...');
      console.log('[Upload UI] File:', file.name, 'Size:', file.size);
      
      // Step 1: Upload file directly to storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log('[Upload UI] File uploaded to:', file_url);
      
      if (!file_url) {
        throw new Error('File upload failed - no URL returned');
      }

      console.log('[Upload UI] Calling moderation and save function...');
      
      // Step 2: Call backend to moderate and create database records
      const response = await base44.functions.invoke('uploadImageWithModeration', {
        file_url,
        uploaderName,
        isBot
      });
      
      console.log('[Upload UI] Response received:', response);

      if (!response.data) {
        throw new Error('No response from server');
      }

      const data = response.data;

      if (!data.success) {
        const errorMsg = data.error || 'Upload failed';
        console.error('[Upload UI] Upload failed:', errorMsg);
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      console.log('[Upload UI] ✓ Upload successful!');
      console.log('[Upload UI] Image added to collection - Collectible ID:', data.collectible_id);
      setUploadSuccess(true);
      
      const uploadNum = data.upload_number || '';
      toast.success(`✓ Image uploaded and added to your collection! Upload #${uploadNum}`);
      
      // Grant upload reward
      try {
        await base44.functions.invoke('grantReward', {
          reward_type: 'upload_accepted',
          amount: 100,
          metadata: {
            upload_number: uploadNum,
            image_id: data.image_id,
            collectible_id: data.collectible_id
          }
        });
        console.log('[Upload UI] Reward granted');
      } catch (rewardError) {
        console.error('[Upload UI] Reward grant failed:', rewardError);
      }

      // Create social feed entry
      try {
        const user = await base44.auth.me();
        await base44.entities.SocialFeed.create({
          user_email: user.email,
          activity_type: 'upload',
          title: 'Uploaded a new image',
          description: `${uploaderName} contributed image #${uploadNum}`,
          metadata: {
            upload_number: uploadNum,
            is_bot: isBot,
            image_id: data.image_id,
            collectible_id: data.collectible_id
          }
        });
        console.log('[Upload UI] Social feed entry created');
      } catch (feedError) {
        console.error('[Upload UI] Feed creation failed:', feedError);
      }

      // Broadcast collection update event for real-time refresh
      console.log('[Upload UI] Broadcasting collection update event');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setUploaderName('');
        setIsBot(false);
        setAgreedToTerms(false);
        setUploadSuccess(false);
        setUploadError(null);
      }, 3000);
      
    } catch (error) {
      console.error('[Upload UI] Upload error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Upload failed. Please try again.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 pb-32 overflow-y-auto">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <UploadIcon className="w-10 h-10 text-violet-500" />
            <h1 className="text-4xl font-black">Upload Image</h1>
          </div>
          <p className="text-zinc-400">Contribute to our bot detection database</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                Upload an Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-zinc-300">
                    Select Image
                  </Label>
                  <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-violet-500 transition-colors cursor-pointer">
                    <input
                      id="file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      {preview ? (
                        <div className="space-y-3">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-48 h-48 object-cover rounded-lg mx-auto"
                          />
                          <p className="text-sm text-zinc-400">
                            Click to change image
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageIcon className="w-16 h-16 text-zinc-600 mx-auto" />
                          <div>
                            <p className="text-white font-medium">Click to upload</p>
                            <p className="text-sm text-zinc-500">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Uploader Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">Your Name</Label>
                  <Input
                    id="name"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {/* Bot or Human */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    Image Type
                  </Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsBot(false)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        !isBot
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      👤 Human
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBot(true)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        isBot
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      🤖 AI Bot
                    </button>
                  </div>
                </div>

                {/* AI Enhancement Panel */}
                {uploaderName && (
                  <AnimatePresence>
                    {!showAIPanel ? (
                      <motion.button
                        type="button"
                        onClick={() => setShowAIPanel(true)}
                        className="w-full py-3 px-4 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Enhance with AI
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-zinc-800 rounded-lg p-4 border border-purple-500/30"
                      >
                        <ContentEnhancementPanel
                          topic={uploaderName}
                          onClose={() => setShowAIPanel(false)}
                          onApply={(enhancements) => setAiEnhancements(enhancements)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {/* AI Enhancements Applied */}
                {aiEnhancements && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg"
                  >
                    <p className="text-sm text-green-400 font-medium">✓ AI enhancements applied</p>
                    <p className="text-xs text-green-400/70 mt-1">Questions, description, and tags will be added</p>
                  </motion.div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg"
                  >
                    <p className="text-sm text-red-400 font-medium">Upload Failed</p>
                    <p className="text-xs text-red-400/70 mt-1">{uploadError}</p>
                    <Button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="mt-3 bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                )}

                {/* Terms Agreement */}
                <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    By uploading this image, you confirm that you own the rights to this image and 
                    agree to transfer all rights to Bot or Not for use in the application and for 
                    training purposes. The image will be publicly visible and rated by other users.
                  </p>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={setAgreedToTerms}
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm text-zinc-300 cursor-pointer">
                      I agree to transfer all rights to this image and confirm I am the rightful owner
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isUploading || uploadSuccess}
                  className={`w-full h-12 font-semibold text-lg transition-all ${
                    uploadSuccess
                      ? 'bg-green-600 hover:bg-green-700'
                      : uploadError
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800'
                  } text-white`}
                >
                  {uploadSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Uploaded Successfully!
                    </>
                  ) : isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading & Checking...
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}