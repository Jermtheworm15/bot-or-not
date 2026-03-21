import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { folderId } = await req.json();
    if (!folderId) {
      return Response.json({ error: 'folderId required' }, { status: 400 });
    }

    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // List files in the folder
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=trashed=false and '${folderId}' in parents&spaces=drive&fields=files(id,name,mimeType,webContentLink,parents)&pageSize=1000`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const listData = await listResponse.json();
    if (listData.error) {
      return Response.json({ error: `Drive API error: ${listData.error.message}` }, { status: 400 });
    }

    const files = listData.files || [];

    // Filter image files and folders for recursive search
    const imageFiles = files.filter(f => 
      f.mimeType && f.mimeType.startsWith('image/')
    );

    // Also get images from subfolders
    const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    let allImages = [...imageFiles];

    for (const folder of folders) {
      const subResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=trashed=false and '${folder.id}' in parents&spaces=drive&fields=files(id,name,mimeType)&pageSize=1000`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const subData = await subResponse.json();
      const subImages = (subData.files || []).filter(f => 
        f.mimeType && f.mimeType.startsWith('image/')
      );
      allImages = allImages.concat(subImages.map(img => ({ ...img, parentId: folder.id })));
    }

    if (allImages.length === 0) {
      return Response.json({ message: 'No image files found in folder or subfolders', filesFound: files.length }, { status: 200 });
    }

    // Import images to database
    const importedImages = [];
    for (const file of allImages) {
      try {
        // Get direct download link for the image
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        
        const image = await base44.asServiceRole.entities.Image.create({
          url: downloadUrl,
          is_bot: false,
          source: 'google_drive_human_faces',
          user_uploaded: false,
          uploader_name: 'Dataset Import'
        });

        importedImages.push({
          id: image.id,
          name: file.name,
          url: downloadUrl
        });
      } catch (err) {
        console.error(`Error importing ${file.name}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      importedCount: importedImages.length,
      totalFound: imageFiles.length,
      images: importedImages
    }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});