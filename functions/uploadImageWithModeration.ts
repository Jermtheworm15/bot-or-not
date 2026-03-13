import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Upload] Starting upload for user:', user.email);

        const formData = await req.formData();
        const file = formData.get('file');
        const uploaderName = formData.get('uploaderName');
        const isBotString = formData.get('isBot');
        const isBot = isBotString === 'true' || isBotString === true;

        console.log('[Upload] Received data - File:', !!file, 'Name:', uploaderName, 'IsBot:', isBot);

        if (!file) {
            console.error('[Upload] No file provided');
            return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        if (!uploaderName || uploaderName.trim() === '') {
            console.error('[Upload] No uploader name');
            return Response.json({ success: false, error: 'Uploader name is required' }, { status: 400 });
        }

        console.log('[Upload] Uploading file...');
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        console.log('[Upload] File uploaded to storage:', file_url);

        if (!file_url) {
            console.error('[Upload] File upload returned no URL');
            return Response.json({ 
                success: false, 
                error: 'Failed to upload file to storage' 
            }, { status: 500 });
        }

        // AI Moderation check
        console.log('[Upload] Running moderation check...');
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
            console.log('[Upload] Moderation failed:', moderation.reason);
            return Response.json({ 
                success: false,
                error: `Image rejected: ${moderation.reason}` 
            }, { status: 400 });
        }

        console.log('[Upload] Moderation passed');

        // AI analysis for tags and categories
        console.log('[Upload] Running AI analysis...');
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

        console.log('[Upload] AI analysis complete');

        // Atomically get next upload sequence number
        console.log('[Upload] Getting upload sequence number...');
        let uploadSequence = 1;
        
        const counters = await base44.asServiceRole.entities.UserUploadCounter.filter({ 
            user_email: user.email 
        });

        if (counters.length > 0) {
            const counter = counters[0];
            uploadSequence = (counter.current_count || 0) + 1;
            await base44.asServiceRole.entities.UserUploadCounter.update(counter.id, {
                current_count: uploadSequence
            });
        } else {
            await base44.asServiceRole.entities.UserUploadCounter.create({
                user_email: user.email,
                current_count: 1
            });
            uploadSequence = 1;
        }

        console.log('[Upload] Sequence number:', uploadSequence);

        // Create the image record
        console.log('[Upload] Creating image record...');
        const newImage = await base44.asServiceRole.entities.Image.create({
            url: file_url,
            is_bot: isBot,
            source: 'user-upload',
            user_uploaded: true,
            uploader_name: uploaderName.trim(),
            creator_upload_sequence: uploadSequence,
            ai_tags: aiAnalysis.tags || [],
            ai_category: aiAnalysis.category || 'other',
            nsfw_flag: (aiAnalysis.nsfw_score || 0) > 0.5,
            nsfw_score: aiAnalysis.nsfw_score || 0
        });

        console.log('[Upload] Image record created successfully - ID:', newImage.id);

        if (!newImage.id) {
            console.error('[Upload] Image created but no ID returned');
            return Response.json({ 
                success: false, 
                error: 'Failed to save image to database' 
            }, { status: 500 });
        }

        // Create collectible for uploaded image
        console.log('[Upload] Creating collectible for image:', newImage.id);
        try {
            const collectible = await base44.asServiceRole.entities.ImageCollectible.create({
                image_id: newImage.id,
                owner_email: user.email,
                original_uploader_email: user.email,
                creator_upload_sequence: uploadSequence,
                average_difficulty: 5.0,
                vote_count: 0,
                value_score: 5.0,
                rarity_tier: 'common',
                acquisition_date: new Date().toISOString(),
                total_trades: 0,
                is_listed: false
            });
            console.log('[Upload] Collectible created successfully - ID:', collectible.id);
        } catch (collectibleError) {
            console.error('[Upload] Failed to create collectible:', collectibleError.message);
            // Don't fail the upload if collectible creation fails
        }

        // Ensure user has a wallet
        console.log('[Upload] Checking wallet...');
        const wallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: user.email });
        if (wallets.length === 0) {
            await base44.asServiceRole.entities.TokenWallet.create({
                user_email: user.email,
                balance: 1000,
                lifetime_earned: 1000,
                lifetime_spent: 0
            });
            console.log('[Upload] Wallet created');
        }

        console.log('[Upload] Upload completed successfully! Image ID:', newImage.id, 'Sequence:', uploadSequence);

        return Response.json({ 
            success: true,
            message: 'Image uploaded successfully',
            upload_number: uploadSequence,
            image_id: newImage.id,
            image_url: file_url
        });

    } catch (error) {
        console.error('[Upload] CRITICAL ERROR:', error.message);
        console.error('[Upload] Error stack:', error.stack);
        return Response.json({ 
            success: false,
            error: error.message || 'Upload failed - unknown error' 
        }, { status: 500 });
    }
});