'use server';
/**
 * @fileOverview Generates a funny roast or movie quote based on match stats.
 *
 * - generateMatchRoast - A function that generates a roast based on match stats.
 * - GenerateMatchRoastInput - The input type for the generateMatchRoast function.
 * - GenerateMatchRoastOutput - The return type for the generateMatchRoast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMatchRoastInputSchema = z.object({
  winningScore: z.number().describe('The score of the winning team.'),
  losingScore: z.number().describe('The score of the losing team.'),
  winnerName: z.string().describe('The name of the winning player.'),
  loserName: z.string().describe("The name of the losing player."),
});
export type GenerateMatchRoastInput = z.infer<typeof GenerateMatchRoastInputSchema>;

const GenerateMatchRoastOutputSchema = z.object({
  roast: z.string().describe('A funny movie dialogue for the winner to roast the loser.'),
});
export type GenerateMatchRoastOutput = z.infer<typeof GenerateMatchRoastOutputSchema>;

export async function generateMatchRoast(input: GenerateMatchRoastInput): Promise<GenerateMatchRoastOutput> {
  return generateMatchRoastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMatchRoastPrompt',
  input: {schema: GenerateMatchRoastInputSchema},
  output: {schema: GenerateMatchRoastOutputSchema},
  prompt: `You are an expert on witty and iconic English movie quotes. Your task is to select a fitting, real movie dialogue for the winner of a football match to taunt the loser.

The match details are:
- Winner: {{{winnerName}}} (Score: {{{winningScore}}})
- Loser: {{{loserName}}} (Score: {{{losingScore}}})

Strict Guidelines:
1.  **Use ONLY real, well-known English movie dialogues.** Do not make up your own lines.
2.  **The dialogue must fit the context.** Consider the score difference. A dialogue for a narrow 1-0 win should be different from a crushing 7-0 victory.
3.  **The tone should be witty, sarcastic, and confident.**
4.  **Provide only ONE dialogue** for the winner to use against the loser.

Contextual Dialogue Examples:
-   For a **huge, one-sided win** (e.g., 5-0): "Some motherf***ers are always trying to ice-skate uphill." (from Blade) or "You're killin' me, Smalls!" (from The Sandlot).
-   For a **narrow, hard-fought win** (e.g., 2-1): "I live my life a quarter mile at a time." (from The Fast and the Furious) or "Looks like I picked the wrong week to quit sniffing glue." (from Airplane!).
-   For a **comeback win**: "I'll be back." (from The Terminator) or "Look at me. I am the captain now." (from Captain Phillips).
-   For a simple, confident win: "I'm your huckleberry." (from Tombstone) or "I feel the need... the need for speed." (from Top Gun).

Now, select the best real English movie dialogue for {{{winnerName}}} to roast {{{loserName}}} after winning {{{winningScore}}}-{{{losingScore}}}.
  `,
});

const generateMatchRoastFlow = ai.defineFlow(
  {
    name: 'generateMatchRoastFlow',
    inputSchema: GenerateMatchRoastInputSchema,
    outputSchema: GenerateMatchRoastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
