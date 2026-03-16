import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { imageId, isBot, difficulty, playerAccuracy } = await req.json();

    if (!imageId || isBot === undefined) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Difficulty levels: 1 (easy), 2 (medium), 3 (hard)
    const level = difficulty || 2;
    
    // Adapt difficulty based on player accuracy
    let adaptedLevel = level;
    if (playerAccuracy !== undefined) {
      if (playerAccuracy > 80 && level < 3) adaptedLevel = Math.min(3, level + 1);
      if (playerAccuracy < 40 && level > 1) adaptedLevel = Math.max(1, level - 1);
    }

    // Generate AI decision based on difficulty
    const decision = generateAIDecision(isBot, adaptedLevel);

    return Response.json({
      guessedBot: decision.guessedBot,
      confidence: decision.confidence,
      difficulty: adaptedLevel,
      reasoning: decision.reasoning
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateAIDecision(isBot, difficulty) {
  // Difficulty 1 (Easy): 50-60% accuracy
  // Difficulty 2 (Medium): 65-75% accuracy
  // Difficulty 3 (Hard): 80-90% accuracy

  const accuracyRanges = {
    1: { min: 50, max: 60 },
    2: { min: 65, max: 75 },
    3: { min: 80, max: 90 }
  };

  const range = accuracyRanges[difficulty] || accuracyRanges[2];
  const targetAccuracy = Math.random() * (range.max - range.min) + range.min;
  
  // Determine if AI should guess correctly
  const shouldBeCorrect = Math.random() * 100 < targetAccuracy;
  const guessedBot = shouldBeCorrect ? isBot : !isBot;

  // Calculate confidence based on decision certainty
  const confidence = shouldBeCorrect ? 
    Math.random() * 40 + 70 : // Correct: 70-100%
    Math.random() * 40 + 50;  // Wrong: 50-90%

  // Generate reasoning based on difficulty
  const reasoning = generateReasoning(isBot, guessedBot, difficulty);

  return {
    guessedBot,
    confidence: Math.round(confidence),
    reasoning
  };
}

function generateReasoning(actualIsBot, guessedBot, difficulty) {
  const reasons = {
    1: [ // Easy AI - simple reasoning
      'Eyes look a bit odd',
      'Background seems unnatural',
      'Skin texture looks weird',
      'Too perfect to be real',
      'Feels genuine to me',
      'Looks like a real person',
      'Something seems off'
    ],
    2: [ // Medium AI - more detailed
      'The pupil reflections are inconsistent',
      'Facial proportions seem slightly off',
      'Hair rendering has unusual patterns',
      'Lighting doesn\'t match the background',
      'Micro-expressions look natural',
      'Teeth have consistent imperfections',
      'Pores and skin texture are consistent'
    ],
    3: [ // Hard AI - advanced analysis
      'Analyzing artifact patterns in high-frequency components',
      'Detected inconsistent bilateral symmetry',
      'Shadow mapping suggests computational generation',
      'Neural network patterns detected in texture synthesis',
      'Biological aging markers present and consistent',
      'Advanced deepfake detection: no evidence found',
      'Verified authentic through metadata analysis'
    ]
  };

  const reasonsList = reasons[difficulty] || reasons[2];
  return reasonsList[Math.floor(Math.random() * reasonsList.length)];
}