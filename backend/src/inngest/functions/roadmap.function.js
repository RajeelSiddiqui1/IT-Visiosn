// roadmap.function.js
import { inngest } from '../client.js';
import { geminiAdaptor } from '../agent.js';
import RoadMap from '../../models/RoadMap.js';
import mongoose from 'mongoose';

export const generateRoadmapFn = inngest.createFunction(
  { id: 'generateRoadmap', retries: 2 },
  { event: 'user/goal.received' },
  async ({ event }) => {
    const { userId, goal } = event.data;

    const prompt = `Generate a 12-week learning roadmap for the goal: "${goal}". Return a valid JSON object with the structure: {"level":"beginner|intermediate|advanced","weeks":[{"week":1,"topics":["topic1","topic2"]},...,{"week":12,"topics":["topicN"]}]} as plain text. Do not include markdown, code fences (like \`\`\`json or \`\`\`), or any additional text before or after the JSON object.`;

    const raw = await geminiAdaptor.handler({
      messages: [{ role: 'user', content: prompt }]
    });

    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      if (!parsed.level || !parsed.weeks || !Array.isArray(parsed.weeks)) {
        throw new Error('Invalid JSON structure');
      }
    } catch (error) {
      throw new Error(`Gemini did not return valid JSON: ${error.message}`);
    }

    const { level, weeks } = parsed;

    await RoadMap.create({
      user: new mongoose.Types.ObjectId(userId),
      goal,
      level,
      weeks
    });
    return { userId, level, weeks };
  }
);