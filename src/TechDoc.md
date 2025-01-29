# Technical Documentation: Source Code Structure Analysis

## App Directory (`/src/app/`)

### API Routes

#### `/api/leaderboard/route.ts`
- **Role**: Handles fetching leaderboard data from Google Sheets
- **Key Functions**: `GET()`
- **Importance**: Critical - Core endpoint for leaderboard functionality
- **Status**: Active and necessary

#### `/api/fixtures/gameweek/route.ts`
- **Role**: Manages fixture data retrieval
- **Key Functions**: `GET()`
- **Importance**: Critical - Required for predictions feature
- **Status**: Active and necessary

#### `/api/predictions/submit/route.ts`
- **Role**: Handles prediction submissions
- **Key Functions**: `POST()`
- **Importance**: Critical - Core endpoint for prediction submissions
- **Status**: Active and necessary

### Pages

#### `/app/leaderboard/page.tsx`
- **Role**: Leaderboard display page
- **Key Functions**: 
  - `LeaderboardPage()`
  - `fetchLeaderboard()`
- **Importance**: Critical - Main leaderboard view
- **Status**: Active and necessary

#### `/app/predictions/page.tsx`
- **Role**: Predictions entry page
- **Key Functions**:
  - `PredictionsPage()`
  - `handleScoreChange()`
  - `handleSubmit()`
- **Importance**: Critical - Core prediction functionality
- **Status**: Active and necessary

#### `/app/user/page.tsx`
- **Role**: User selection page
- **Key Functions**: 
  - `UserPage()`
  - `handleUserSelect()`
- **Importance**: Critical - User authentication flow
- **Status**: Active and necessary

## Components Directory (`/src/components/`)

### UI Components (`/components/ui/`)
- **Files**: `avatar.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `skeleton.tsx`, `table.tsx`, `toast.tsx`, `toaster.tsx`
- **Role**: Shadcn UI component library implementations
- **Importance**: Critical - Core UI components
- **Status**: All active and necessary

### Hooks (`/components/hooks/` and `/src/hooks/`)
- **Note**: Duplicate hook directories detected
- **Files**: `use-toast.ts` exists in both locations
- **Recommendation**: Consolidate into single `/src/hooks` directory
- **Status**: Redundant - Remove `/components/hooks`

### Feature Components

#### `/components/leaderboard/leaderboard-table.tsx`
- **Role**: Leaderboard display component
- **Key Functions**: `LeaderboardTable()`
- **Importance**: Critical - Core leaderboard display
- **Status**: Active and necessary

#### `/components/predictions/prediction-form.tsx`
- **Role**: Prediction form component
- **Importance**: Appears incomplete/unused
- **Status**: Potentially redundant - Consider removing as functionality exists in page component

## Recommendations

1. **Remove Redundant Files**:
   - `/components/hooks/` directory (consolidate to `/src/hooks`)
   - `/components/predictions/prediction-form.tsx` (functionality exists in page)

2. **Consolidate Hooks**:
   - Move all hooks to `/src/hooks`
   - Ensure consistent imports across application

3. **File Structure Improvements**:
   - Consider moving API logic to `/src/services`
   - Group related components more logically
   - Consider adding type definitions directory

4. **Documentation Needs**:
   - Add JSDoc comments to key functions
   - Create README files for major directories
   - Document state management patterns

This analysis suggests the codebase is generally well-structured but has some minor redundancies that could be cleaned up for better maintainability.
