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

        // AI analysis for tags and categories
        const aiAnalysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this image and provide:
1. A list of descriptive tags (5-10 keywords that describe what's in the image)
2. A single category that best fits this image (choose from: portrait, landscape, abstract, object, animal, food, technology, art, other)
3. NSFW detection - rate if this image contains inappropriate, explicit, or NSFW content on a scale of 0-1 (0 = completely safe, 1 = explicit/NSFW)`,
            file_urls: [file_url],
            response_json_schema: {
                type: "object",
                properties: {
                    tags: {
                        type: "array",
                        items: { type: "string" }
                    },
                    category: {
                        type: "string"
                    },
                    nsfw_score: {
                        type: "number"
                    }
                }
            }
        });

        // Create the image record using service role to ensure it's created
        await base44.asServiceRole.entities.Image.create({
            url: file_url,
            is_bot: isBot,
            source: 'user-upload',
            user_uploaded: true,
            uploader_name: uploaderName.trim(),
            ai_tags: aiAnalysis.tags || [],
            ai_category: aiAnalysis.category || 'other',
            nsfw_flag: (aiAnalysis.nsfw_score || 0) > 0.5,
            nsfw_score: aiAnalysis.nsfw_score || 0
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