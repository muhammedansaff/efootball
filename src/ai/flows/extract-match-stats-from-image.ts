'use server';
/**
 * @fileOverview Extracts football match statistics from an image.
 *
 * - extractMatchStatsFromImage - A function that handles the extraction of match stats from an image.
 * - ExtractMatchStatsFromImageInput - The input type for the extractMatchStatsFromImage function.
 * - ExtractMatchStatsFromImageOutput - The return type for the extractMatchStatsFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMatchStatsFromImageInputSchema = z.object({
  matchStatsImage: z
    .string()
    .describe(
      'The image of the football match stats, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type ExtractMatchStatsFromImageInput = z.infer<typeof ExtractMatchStatsFromImageInputSchema>;

const PlayerStatsSchema = z.object({
  name: z.string().describe('Player name'),
  score: z.number().describe('Score'),
  possession: z.string().describe('Possession percentage'),
  shots: z.number().describe('Total shots'),
  shotsOnTarget: z.number().describe('Shots on target'),
  fouls: z.number().describe('Number of fouls'),
  offsides: z.number().describe('Number of offsides'),
  cornerKicks: z.number().describe('Number of corner kicks'),
  freeKicks: z.number().describe('Number of free kicks'),
  passes: z.number().describe('Total passes'),
  successfulPasses: z.number().describe('Number of successful passes'),
  crosses: z.number().describe('Number of crosses'),
  interceptions: z.number().describe('Number of interceptions'),
  tackles: z.number().describe('Number of tackles'),
  saves: z.number().describe('Number of saves'),
  passAccuracy: z.number().optional().describe('Pass accuracy percentage'),
  redCards: z.number().optional().describe('Number of red cards'),
  userId: z.string().optional().describe('ID of the user associated with these stats'),
});
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

const ExtractMatchStatsFromImageOutputSchema = z.object({
  team1Name: z.string().describe('The name of the first team/player.'),
  team2Name: z.string().describe('The name of the second team/player.'),
  team1Stats: PlayerStatsSchema.describe("Statistics for the first team/player."),
  team2Stats: PlayerStatsSchema.describe("Statistics for the second team/player."),
});
export type ExtractMatchStatsFromImageOutput = z.infer<typeof ExtractMatchStatsFromImageOutputSchema>;

export async function extractMatchStatsFromImage(
  input: ExtractMatchStatsFromImageInput
): Promise<ExtractMatchStatsFromImageOutput> {
  return extractMatchStatsFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMatchStatsFromImagePrompt',
  input: {schema: ExtractMatchStatsFromImageInputSchema},
  output: {schema: ExtractMatchStatsFromImageOutputSchema},
  prompt: `You are an expert football match statistician. Your task is to extract key information from a provided image of match statistics.

  Analyze the image and extract the following information for both players:
  - Team/Player Names
  - Final Score
  - Possession
  - Shots
  - Shots on Target
  - Fouls
  - Offsides
  - Corner Kicks
  - Free Kicks
  - Passes
  - Successful Passes
  - Crosses
  - Interceptions
  - Tackles
  - Saves

  Ensure the extracted data is accurate and corresponds to the information presented in the image.

  Image: {{media url=matchStatsImage}}
  
  Output the information in JSON format.
  `,
});

const extractMatchStatsFromImageFlow = ai.defineFlow(
  {
    name: 'extractMatchStatsFromImageFlow',
    inputSchema: ExtractMatchStatsFromImageInputSchema,
    outputSchema: ExtractMatchStatsFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // Fallback logic for scores if not in player stats
    if (output!.team1Stats.score === undefined || output!.team2Stats.score === undefined) {
      // Look for a general match score if player scores are missing
    }

    return output!;
  }
);
