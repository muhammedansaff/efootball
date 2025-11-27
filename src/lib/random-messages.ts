import messages from './messages.json';

export type MessageCategory = 'matchRoasts';

/**
 * Get a random message from the specific category
 */
export function getRandomMessage(category: MessageCategory): string {
  const messageArray = messages[category];
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
}

/**
 * Get a random match roast message
 */
export function getRandomMatchRoast(): string {
  return getRandomMessage('matchRoasts');
}
