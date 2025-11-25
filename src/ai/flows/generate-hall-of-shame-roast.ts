'use server';
/**
 * @fileOverview Generates roasts for users in the Hall of Shame.
 *
 * - generateHallOfShameRoast - A function that generates a roast message.
 * - GenerateHallOfShameRoastInput - The input type for the generateHallOfShameRoast function.
 * - GenerateHallOfShameRoastOutput - The return type for the generateHallOfShameRoast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHallOfShameRoastInputSchema = z.object({
  category: z.string().describe('The category of the embarrassing match stat. e.g., "Revenge", "Losing / Failure", "Cheating", "Challenge / Ego fight", "Comeback"'),
  stat: z.string().describe('The specific statistic that is being shamed, e.g., "10 goals conceded", "7-0 Loss", "1 shot on target".'),
  username: z.string().describe('The username of the user to roast.'),
  opponentName: z.string().describe("The opponent's name."),
});
export type GenerateHallOfShameRoastInput = z.infer<typeof GenerateHallOfShameRoastInputSchema>;

const GenerateHallOfShameRoastOutputSchema = z.object({
  fameRoast: z.string().describe('A quote of praise for the winner, using a real English movie dialogue.'),
  shameRoast: z.string().describe('A quote of shame for the loser, using a real English movie dialogue.'),
});
export type GenerateHallOfShameRoastOutput = z.infer<typeof GenerateHallOfShameRoastOutputSchema>;

export async function generateHallOfShameRoast(input: GenerateHallOfShameRoastInput): Promise<GenerateHallOfShameRoastOutput> {
  return generateHallOfShameRoastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHallOfShameRoastPrompt',
  input: {schema: GenerateHallOfShameRoastInputSchema},
  output: {schema: GenerateHallOfShameRoastOutputSchema},
  prompt: `You are an expert on iconic English-language movies. Your task is to select two fitting, real movie dialogues for a given football match scenario: one for the winner (Fame) and one for the loser (Shame).

  Theme: {{{category}}}
  Winner: {{{username}}}
  Loser: {{{opponentName}}}
  The defining stat: {{{stat}}}

  Strict Guidelines:
  - You MUST use real, well-known English movie dialogues.
  - The dialogues must perfectly fit the theme and the stat.
  - The output must be a JSON object with two keys: "fameRoast" for the winner and "shameRoast" for the loser.

  Example for "Losing / Failure" with stat "7-0 Loss":
  - fameRoast (for winner): "My name is Maximus Decimus Meridius... and I will have my vengeance."
  - shameRoast (for loser): "I'm in a glass case of emotion!"
  
  Example for "Challenge / Ego fight":
  - fameRoast (for winner): "You can't handle the truth!"
  - shameRoast (for loser): "This is not 'Nam. This is bowling. There are rules."

  Now, select the best real dialogues for this scenario.
  `,
});

const generateHallOfShameRoastFlow = ai.defineFlow(
  {
    name: 'generateHallOfShameRoastFlow',
    inputSchema: GenerateHallOfShameRoastInputSchema,
    outputSchema: GenerateHallOfShameRoastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
