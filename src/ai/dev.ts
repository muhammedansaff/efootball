'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-hall-of-shame-roast.ts';
import '@/ai/flows/generate-badge-description.ts';
import '@/ai/flows/generate-match-roast.ts';
import '@/ai/flows/extract-match-stats-from-image.ts';
import '@/ai/flows/generate-hall-of-shame-category.ts';
