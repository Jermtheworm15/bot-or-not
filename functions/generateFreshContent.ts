import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
        try {
          const base44 = createClientFromRequest(req);
          const user = await base44.auth.me();

          if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const MIN_IMAGES = 5000;
          const BATCH_SIZE = 100;
          let totalImages = 0;
          let offset = 0;
          let hasMore = true;

          // First, count existing images
          let existingCount = 0;
          while (hasMore) {
            const batch = await base44.asServiceRole.entities.Image.list('-created_date', BATCH_SIZE, offset);
            if (batch.length === 0) {
              hasMore = false;
            } else {
              existingCount += batch.length;
              offset += BATCH_SIZE;
            }
          }

          totalImages = existingCount;

          // 100+ keyword clusters for diverse content
          const aiKeywords = [
            "AI portrait photorealistic",
            "AI generated face synthetic",
            "AI person digital art",
            "CGI character render",
            "synthetic human portrait",
            "AI landscape digital",
            "AI generated scene",
            "3D render person",
            "Unreal Engine character",
            "digital art portrait",
            "neural network generated person",
            "AI art realistic human",
            "machine learning portrait",
            "generated character face",
            "AI fantasy character",
            "synthetic beauty portrait",
            "AI professional headshot",
            "digital human face",
            "AI fashion model",
            "generated lifestyle photo",
            "AI sports figure",
            "synthetic celebrity",
            "AI business portrait",
            "generated influencer",
            "AI fashion portrait",
            "digital makeup face",
            "AI high fashion",
            "synthetic glamour shot",
            "AI beauty portrait",
            "generated fitness model",
            "AI action character",
            "digital adventure scene",
            "AI cinematic portrait",
            "generated film character",
            "AI storytelling image",
            "synthetic documentary",
            "AI emotional portrait",
            "generated expression face",
            "AI couple portrait",
            "synthetic family photo"
          ];
          
          const realPhotographyKeywords = [
            "DSLR portrait photography",
            "candid street photo",
            "professional headshot",
            "stock photography person",
            "real human portrait",
            "documentary photography",
            "lifestyle photo",
            "fashion photography",
            "studio portrait lighting",
            "natural portrait photography",
            "beauty photography",
            "corporate headshot",
            "editorial photography",
            "professional model",
            "candid moment",
            "travel portrait",
            "cultural portrait",
            "street photography",
            "event photography",
            "wedding photography",
            "family portrait",
            "business portrait",
            "social media photo",
            "influencer photography",
            "product photography",
            "landscape photography",
            "nature photography",
            "wildlife photography",
            "architectural photography",
            "urban photography",
            "environmental portrait",
            "lifestyle brand photo",
            "casual portrait",
            "candid lifestyle",
            "everyday moment",
            "authentic portrait",
            "documentary moment",
            "real people photo",
            "genuine expression",
            "natural lighting portrait"
          ];
          
          const combinedKeywords = [...aiKeywords, ...realPhotographyKeywords];
          
          const getRandomKeywords = (count) => {
            const selected = [];
            for (let i = 0; i < count; i++) {
              selected.push(combinedKeywords[Math.floor(Math.random() * combinedKeywords.length)]);
            }
            return selected;
          };

          // Expanded human image IDs
          const humanIds = [
            "1494790108377-be9c29b29330", "1507003211169-0a1dd7228f2d", "1438761681033-6461ffad8d80",
            "1500648767791-00dcc994a43e", "1534528741775-53994a69daeb", "1522075469751-3a6694fb2f61",
            "1544005313-94ddf0286df2", "1531746020798-e6953c6e8e04", "1506794778202-cad84cf45f1d",
            "1524504388940-b1c1722653e1", "1488426862026-3ee34a7d66df", "1519085360753-af0119f7cbe7",
            "1517841905240-472988babdf9", "1529626455594-4ff0802cfb7e", "1539571696357-5a69c17a67c6"
          ];

          const newImages = [];

          // Generate images until we reach minimum
          while (totalImages < MIN_IMAGES) {
            const needed = MIN_IMAGES - totalImages;
            const toGenerate = Math.ceil(needed / 2);

            // Generate bot images
            for (let i = 0; i < toGenerate; i++) {
              try {
                const prompt = botPrompts[Math.floor(Math.random() * botPrompts.length)];
                const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });

                const imageRecord = await base44.asServiceRole.entities.Image.create({
                  url: result.url,
                  is_bot: true,
                  source: 'ai_generated'
                });
                newImages.push(imageRecord);
                totalImages++;
              } catch (error) {
                console.error('Bot generation error:', error);
              }
            }

            // Add human images
            for (let i = 0; i < toGenerate; i++) {
              try {
                const photoId = humanIds[Math.floor(Math.random() * humanIds.length)];
                const uniqueSig = `${Date.now()}-${Math.random()}`;
                const url = `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&crop=faces&auto=format&q=80&sig=${uniqueSig}`;

                const imageRecord = await base44.asServiceRole.entities.Image.create({
                  url,
                  is_bot: false,
                  source: 'unsplash'
                });
                newImages.push(imageRecord);
                totalImages++;
              } catch (error) {
                console.error('Human image error:', error);
              }
            }
          }

          return Response.json({ 
            success: true,
            existing_count: existingCount,
            new_count: newImages.length,
            total_count: totalImages
          });

        } catch (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
      });