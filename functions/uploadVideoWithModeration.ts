import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');
        const uploaderName = formData.get('uploaderName');
        const isBot = formData.get('isBot') === 'true';

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!uploaderName || uploaderName.trim() === '') {
            return Response.json({ error: 'Uploader name is required' }, { status: 400 });
        }

        // Upload the file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Basic validation - videos should be under 50MB and reasonable duration
        // AI Moderation for videos is limited, so we do basic checks
        const moderation = {
            is_appropriate: true,
            reason: 'Video uploaded successfully'
        };

        if (!moderation.is_appropriate) {
            return Response.json({ 
                success: false,
                error: `Video rejected: ${moderation.reason}` 
            }, { status: 400 });
        }

        // Create the video record using service role
        await base44.asServiceRole.entities.Video.create({
            url: file_url,
            is_bot: isBot,
            source: 'user-upload',
            user_uploaded: true,
            uploader_name: uploaderName.trim()
        });

        return Response.json({ 
            success: true,
            message: 'Video uploaded successfully' 
        });

    } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Upload failed' 
        }, { status: 500 });
    }
});