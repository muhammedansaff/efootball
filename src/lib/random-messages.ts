import messages from './messages.json';

/**
 * Get a random message from a specific category
 * @param category - The category of message to retrieve ('matchRoasts', 'hallOfFameMessages', 'hallOfShameMessages')
 * @returns A random message from the specified category
 */
export function getRandomMessage(category: 'matchRoasts' | 'hallOfFameMessages' | 'hallOfShameMessages'): string {
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

/**
 * Get a random hall of fame message
 */
export function getRandomHallOfFameMessage(): string {
  return getRandomMessage('hallOfFameMessages');
}

/**
 * Get a random hall of shame message
 */
export function getRandomHallOfShameMessage(): string {
  return getRandomMessage('hallOfShameMessages');
}
