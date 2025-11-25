'use server';

/**
 * @fileOverview A flow to generate badge descriptions using Genkit.
 *
 * - generateBadgeDescription - A function that generates a badge description.
 * - GenerateBadgeDescriptionInput - The input type for the generateBadgeduction function.
 * - GenerateBadgeDescriptionOutput - The return type for the generateBadgeDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBadgeDescriptionInputSchema = z.object({
  badgeName: z.string().describe('The name of the badge.'),
  badgeCriteria: z
    .string()
    .describe(
      'The criteria for earning the badge. This can be for a positive achievement or a negative one (a "loser" badge).'
    ),
});
export type GenerateBadgeDescriptionInput = z.infer<
  typeof GenerateBadgeDescriptionInputSchema
>;

const GenerateBadgeDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe(
      'A creative, witty, and engaging description for the badge. Should be fun and in the spirit of football banter.'
    ),
});
export type GenerateBadgeDescriptionOutput = z.infer<
  typeof GenerateBadgeDescriptionOutputSchema
>;

export async function generateBadgeDescription(
  input: GenerateBadgeDescriptionInput
): Promise<GenerateBadgeDescriptionOutput> {
  return generateBadgeDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBadgeDescriptionPrompt',
  input: {schema: GenerateBadgeDescriptionInputSchema},
  output: {schema: GenerateBadgeDescriptionOutputSchema},
  prompt: `You are a creative copywriter specializing in generating badge descriptions for a football gaming app. The tone is witty and full of banter.

  Given the badge name and criteria, create a short, engaging, and creative description. The description can be for a positive achievement or a funny "loser" badge.

  Badge Name: {{{badgeName}}}
  Badge Criteria: {{{badgeCriteria}}}
  `,
});

const generateBadgeDescriptionFlow = ai.defineFlow(
  {
    name: 'generateBadgeDescriptionFlow',
    inputSchema: GenerateBadgeDescriptionInputSchema,
    outputSchema: GenerateBadgeDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
