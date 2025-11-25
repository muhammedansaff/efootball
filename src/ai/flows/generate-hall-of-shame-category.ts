'use server';

/**
 * @fileOverview Generates categories for the Hall of Shame based on embarrassing match stats using AI.
 *
 * - generateHallOfShameCategory - A function that generates a hall of shame category.
 * - GenerateHallOfShameCategoryInput - The input type for the generateHallOfShameCategory function.
 * - GenerateHallOfShameCategoryOutput - The return type for the generateHallOfShameCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHallOfShameCategoryInputSchema = z.object({
  matchStatsDescription: z
    .string()
    .describe(
      'Description of match statistics to generate an embarrassing category for.'
    ),
});
export type GenerateHallOfShameCategoryInput = z.infer<
  typeof GenerateHallOfShameCategoryInputSchema
>;

const GenerateHallOfShameCategoryOutputSchema = z.object({
  categoryName: z.string().describe('The name of the hall of shame category.'),
  categoryDescription: z
    .string()
    .describe('A description of the hall of shame category.'),
  roastMessage: z.string().describe('A savage roast message for the category.'),
});
export type GenerateHallOfShameCategoryOutput = z.infer<
  typeof GenerateHallOfShameCategoryOutputSchema
>;

export async function generateHallOfShameCategory(
  input: GenerateHallOfShameCategoryInput
): Promise<GenerateHallOfShameCategoryOutput> {
  return generateHallOfShameCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHallOfShameCategoryPrompt',
  input: {schema: GenerateHallOfShameCategoryInputSchema},
  output: {schema: GenerateHallOfShameCategoryOutputSchema},
  prompt: `You are an AI assistant specializing in generating embarrassing hall of shame categories for football matches.

You will use the provided match stats description to generate a category name, category description and a savage roast message for the category.

Match Stats Description: {{{matchStatsDescription}}}

Respond in a JSON format.
`,
});

const generateHallOfShameCategoryFlow = ai.defineFlow(
  {
    name: 'generateHallOfShameCategoryFlow',
    inputSchema: GenerateHallOfShameCategoryInputSchema,
    outputSchema: GenerateHallOfShameCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
