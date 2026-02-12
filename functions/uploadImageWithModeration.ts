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

        // AI Moderation check
        const moderation = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this image for content moderation. Check if it contains:
- Inappropriate content (nudity, violence, hate symbols)
- A clear human or AI-generated face/selfie
- Spam or irrelevant content

Respond with: is_appropriate (boolean), reason (string explaining why it passed or failed)`,
            file_urls: [file_url],
            response_json_schema: {
                type: "object",
                properties: {
                    is_appropriate: { type: "boolean" },
                    reason: { type: "string" }
                }
            }
        });

        if (!moderation.is_appropriate) {
            return Response.json({ 
                success: false,
                error: `Image rejected: ${moderation.reason}` 
            }, { status: 400 });
        }

        // Create the image record using service role to ensure it's created
        await base44.asServiceRole.entities.Image.create({
            url: file_url,
            is_bot: isBot,
            source: 'user-upload',
            user_uploaded: true,
            uploader_name: uploaderName.trim()
        });

        return Response.json({ 
            success: true,
            message: 'Image uploaded successfully' 
        });

    } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Upload failed' 
        }, { status: 500 });
    }
});