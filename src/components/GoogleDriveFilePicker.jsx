import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GoogleDriveFilePicker({ onImportComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handlePickFiles = async () => {
    setIsLoading(true);
    try {
      // Get access token for Google Drive
      const accessToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");

      // Initialize Google Picker
      gapi.load('picker', { callback: initPicker(accessToken) });
    } catch (error) {
      console.error('Error initializing file picker:', error);
      alert('Failed to open Google Drive picker');
      setIsLoading(false);
    }
  };

  const initPicker = (accessToken) => () => {
    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS_IMAGES)
      .addView(google.picker.ViewId.FOLDER)
      .setOAuthToken(accessToken)
      .setCallback(handlePickerResult)
      .build();
    picker.setVisible(true);
  };

  const handlePickerResult = async (data) => {
    if (data.action === google.picker.Action.PICKED) {
      setIsLoading(true);
      const docs = data.docs;
      let count = 0;

      for (const doc of docs) {
        try {
          // Get direct download link
          const fileUrl = `https://drive.google.com/uc?export=view&id=${doc.id}`;
          
          // Create image entity
          await base44.entities.Image.create({
            url: fileUrl,
            is_bot: false,
            source: 'google_drive',
            user_uploaded: false,
            uploader_name: 'Google Drive Import'
          });
          count++;
        } catch (error) {
          console.error('Error importing file:', doc.name, error);
        }
      }

      setImportedCount(count);
      setIsLoading(false);
      if (onImportComplete) onImportComplete(count);
      alert(`Successfully imported ${count} image(s)`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      <button
        onClick={handlePickFiles}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-bold transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Import from Google Drive
          </>
        )}
      </button>
      {importedCount > 0 && (
        <span className="text-sm text-green-400">+{importedCount} imported</span>
      )}
    </motion.div>
  );
}