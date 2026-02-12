import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload as UploadIcon, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploaderName, setUploaderName] = useState('');
  const [isBot, setIsBot] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

    try {
      // Create form data for backend function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaderName', uploaderName);
      formData.append('isBot', isBot);

      // Call backend function to handle upload and moderation securely
      const { data } = await base44.functions.invoke('uploadImageWithModeration', formData);

      if (!data.success) {
        toast.error(data.error || 'Upload failed');
        setIsUploading(false);
        return;
      }

      setUploadSuccess(true);
      toast.success('Image uploaded successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setUploaderName('');
        setIsBot(false);
        setAgreedToTerms(false);
        setUploadSuccess(false);
      }, 2000);
      
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12">
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
              <CardTitle className="text-white">Upload a Selfie</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-zinc-300">Select Image</Label>
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
                          <p className="text-sm text-zinc-400">Click to change image</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageIcon className="w-16 h-16 text-zinc-600 mx-auto" />
                          <div>
                            <p className="text-white font-medium">Click to upload</p>
                            <p className="text-sm text-zinc-500">PNG, JPG up to 10MB</p>
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
                  <Label className="text-zinc-300">Image Type</Label>
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
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-semibold text-lg"
                >
                  {uploadSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Uploaded Successfully!
                    </>
                  ) : isUploading ? (
                   'Uploading & Checking...'
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