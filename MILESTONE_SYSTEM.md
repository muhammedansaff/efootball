# Milestone System Documentation

## Overview

The milestone system tracks user progress and creates new milestones automatically every 2 days when users interact with the app.

## How Milestones Are Created

### Automatic Creation on Login

- **Trigger**: Milestones are checked and created when the app loads (in the `AuthProvider` component)
- **Frequency**: A new milestone is created every **2 days** (48 hours)
- **Location**: `src/providers/auth-provider.tsx` - `manageMilestones()` function

### Creation Logic

1. When a user logs in or the app loads, the system queries for the most recently created milestone
2. It checks the `lastUpdated` timestamp of that milestone
3. If more than 2 days have passed since the last milestone was created, a new one is added
4. Only ONE milestone is created at a time from the predefined list

### Predefined Milestones

The system has a predefined list of milestones in `milestoneCreationJobs`:

```typescript
const milestoneCreationJobs: Array<Omit<Milestone, "id" | "lastUpdated">> = [
  {
    title: "First Win",
    description: "Get your first win in the barn.",
    stat: "wins",
    target: 1,
  },
  {
    title: "10 Wins",
    description: "Achieve 10 total wins.",
    stat: "wins",
    target: 10,
  },
  {
    title: "25 Wins",
    description: "Achieve 25 total wins.",
    stat: "wins",
    target: 25,
  },
  {
    title: "25 Goals",
    description: "Score 25 goals.",
    stat: "goalsFor",
    target: 25,
  },
  {
    title: "100 Goals",
    description: "Score a total of 100 goals.",
    stat: "goalsFor",
    target: 100,
  },
  {
    title: "50 Tackles",
    description: "Make 50 successful tackles.",
    stat: "tackles",
    target: 50,
  },
  {
    title: "10 Matches",
    description: "Play 10 matches.",
    stat: "matchesPlayed",
    target: 10,
  },
];
```

## How Users Achieve Milestones

### Achievement Tracking

Users achieve milestones by accumulating stats through playing matches. The achievement is calculated in real-time on the Journey page.

### Stat Tracking

When a match is uploaded (`upload-match-button.tsx`), user stats are updated:

- **Wins/Losses/Draws**: Incremented based on match result
- **Goals For**: User's score in the match
- **Goals Against**: Opponent's score
- **Tackles**: Number of tackles made
- **Passes**: Total and successful passes
- **Shots**: Total and shots on target
- **Saves**: Goalkeeper saves
- **Fouls**: Fouls committed
- **Red Cards**: Red cards received
- **Total Possession**: Accumulated possession percentage
- **Matches Played**: Total number of matches

### Achievement Calculation

The Journey page (`src/app/(app)/journey/page.tsx`) calculates achievement in real-time:

```typescript
const calculateProgress = (milestone: Milestone, currentUser: User) => {
  let currentProgress = 0;
  switch (milestone.stat) {
    case "wins":
      currentProgress = currentUser.stats.wins;
      break;
    case "goalsFor":
      currentProgress = currentUser.stats.goalsFor;
      break;
    case "tackles":
      currentProgress = currentUser.stats.tackles;
      break;
    case "matchesPlayed":
      currentProgress =
        currentUser.stats.wins +
        currentUser.stats.losses +
        currentUser.stats.draws;
      break;
    default:
      currentProgress = 0;
  }

  const progressPercentage = Math.min(
    (currentProgress / milestone.target) * 100,
    100
  );
  const achieved = currentProgress >= milestone.target;

  return {
    ...milestone,
    progress: currentProgress,
    achieved,
    progressPercentage: progressPercentage,
  };
};
```

### Display

- **Active Milestones**: Show progress bar with current/target values
- **Achieved Milestones**: Display with a checkmark icon and highlighted background
- **Progress Percentage**: Visual progress bar showing how close the user is to achieving the milestone

## Firestore Collection Structure

### Collection: `milestones`

Each milestone document contains:

```typescript
{
  id: string; // Auto-generated document ID
  title: string; // e.g., "First Win"
  description: string; // e.g., "Get your first win in the barn."
  target: number; // e.g., 1, 10, 25, etc.
  stat: "wins" | "goalsFor" | "tackles" | "cleanSheets" | "matchesPlayed";
  lastUpdated: Timestamp; // When this milestone was created
}
```

## Key Features

1. **Progressive Unlocking**: Milestones are unlocked gradually over time (every 2 days)
2. **No Duplicates**: The system checks existing milestones to avoid creating duplicates
3. **Real-time Progress**: Users see their progress update immediately after playing matches
4. **Visual Feedback**: Clear visual indicators for progress and achievement
5. **Automatic Management**: No manual intervention needed - milestones are created automatically

## Adding New Milestones

To add new milestones to the system:

1. Add a new entry to the `milestoneCreationJobs` array in `src/providers/auth-provider.tsx`
2. Ensure the `stat` field matches one of the allowed types: `'wins' | 'goalsFor' | 'tackles' | 'cleanSheets' | 'matchesPlayed'`
3. Set an appropriate `target` value
4. If using a new stat type, update the `Milestone` type in `src/lib/types.ts` and the `calculateProgress` function in `src/app/(app)/journey/page.tsx`

Example:

```typescript
{
    title: "Century of Goals",
    description: "Score 100 goals total.",
    stat: "goalsFor",
    target: 100
}
```

## Troubleshooting

### Milestones Not Creating

- Check browser console for errors in the `manageMilestones` function
- Verify Firestore permissions allow reading/writing to the `milestones` collection
- Ensure at least 2 days have passed since the last milestone was created

### Progress Not Updating

- Verify that user stats are being updated correctly in `upload-match-button.tsx`
- Check that the stat type in the milestone matches the stat being tracked
- Ensure the `calculateProgress` function includes a case for the milestone's stat type

### Achievement Not Showing

- Verify the user's current stat value meets or exceeds the milestone target
- Check that the milestone is being fetched correctly from Firestore
- Ensure the Journey page is properly calculating the `achieved` flag
