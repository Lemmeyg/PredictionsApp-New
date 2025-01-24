# Objective
To build a web application that allows users to:
- view upcoming soccer matches
-Predict the outcomes of soccer matches.
- Track and compare predictions against actual results.
- View a leaderboard ranking users based on their prediction accuracy.

## Tools and Technologies
- **UI Components**: [shadcn/ui](https://shadcn.dev/)
- **Database**: Googsheets (via API)
- **API Calls**: [axios](https://axios-http.com/)
-**Soccer match data** (www.api-football.com)
- **Navigation**: [react-router-dom](https://reactrouter.com/)
- **Framework**: [Next.js](https://nextjs.org/) (using App Router)

## Front end UX design
- pages will be created for primarily mobile devices.
- The design will be modern and clean with a focus on the user experience.
- the design will be based on the [shadcn/ui](https://shadcn.dev/) library.
- the design will be responsive and will look good on both laptop and mobile devices.
- the design will be consistent and will use the same colors and fonts throughout the application.

##Guiding points
Use Typescript as the main language, using JS only when there are no other options
Keep the file structure as simple a clean as possible.

##Credentials
-NEXT_PUBLIC_BASE_URL=http://localhost:3000
- googlesheets sheet ID Sheet details - 1OJpcocsLUD-5CUGTZcaNJzJ2ZyHw-hG-ryXUo25Ro7E/edit?gid=442654296#gid=442654296
-Googlesheets API Key : AIzaSyATKZC6GFRmM02W5SMqmwydBgCpQ3dpr3Q

{
  "type": "service_account",
  "project_id": "predictionsapp-new",
  "private_key_id": "f45c87b70893a6424569f1dbb87ef12d635d9700",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCz00O6kZU717A4\nYd+qRJoKCQh+G+EbR/9PRH82nFDlaHN8R8VCgUM7qwK0O42swMuZuOUdtYBihpH9\n5CeuxXXunjNQ6pHWacrhqZvbQ+kY9fgscZB2z3RDwyGNFE/SiLVOmJ8I68/oM+9u\nDVCnExphPmbNJS6/zgkiyXGuzN4ypdDZk6ovpnrKioRp21vMVFaa0aOkhKXgo9Cp\nqrArldPsfjLgF7HMDfVaWELoMMUAd6icq8U77ml/DnMH93uTLWblUtaHIhjNCfly\nvLEnU9Co+qkHeR8BKYIf/PTTzyO4V7dIj5fC20JxSjvi8TZgFg8+ighU5mwdobUo\nFMkc4Gl5AgMBAAECggEAFfIi5kRhYjTh2ZWvQFZANtiQn+Ra4fOUz9mYDWQBFug7\nDNgs9Z91IzVs/m40rXg3eM6Y7pnhndSWwVWcdq68RGdr85R3ASP22bizb8xfSJev\nJoxjAS7y/ViVcgRgM/1RZDLJ2OK/hDL/Zc7L8KHrEqJVFTT0Gj4kvQk43ah8txEy\n+jS9AtDHKtAOhzE/66E8DFWYVdENbiVb9lbp/Rq94+ZpZ7X0wXD++RnPhQAwEQIZ\nB8CGUFiwLR3/jDntH3r7VzhD1CQF7PXIexSp5eMg5mfChR7qlQEL8pk99V6/dglg\nJ0GYn6ocbslFjQ7dMvhw7H+pVDrzwJ5xplf1XZV0sQKBgQDxcEIlN1tzQ5+UHP8B\nE3YyGkkxDoI9nYpRdpIAy7xQ4twMgmbhdbViMqo/im2v2vFkHUZ8ptnhgsZs0zXr\nofRASmnNbfVlRQfnaTTme9ySN/vaG0acurwqujoSscCegtay6Zo5nxsasQXFmhNA\ny/iuXLXwZHTloJ3HAULVIE3zMQKBgQC+q7cQc+7M4umA4M55u7cn32cUDwNra6XY\np3nE8WBbCzEteMLvZVZjmMToGxyeEHx99sMJD0C1dVcTEeWSUFaTTuKVoFS+mz3u\nLVuzuAIE7URxaJanY+4Onqsk2V110wSjSbeuXbmEw54f0FZmN+BsbUEi9xytkjvq\nMIPS9iX4yQKBgQCH+ByIMQDDjRXVp+7EgF1UIhGOGwmmAY7gCdJ3uEU5mEksklO2\nLUAVKUtPtXnIS5keNI55rM2PfsKYjuoS5YZUnpOvKXnFqnalEE7GboLtpbGkRzAh\nG9jUh0QlOw2rNywKXhyIzt3IzmDdw8OL/lLyfyvHUguzNh0k8cTdme/MQQKBgQCt\nrJ13+BGpQHrusFaCXbDMOdqbU72KqCgNeycYc8CPzVcDEz+EbarN14Zr4N4lP+EV\nn6Ixa1pGrtYcga25o0Hote7/2WW3pJI5k8k2n0H/mNtB7cFkQUrCuFYtn2xY+Vf9\nIBWWVrq4KrKqScuZGgZq3O162tmdZFj8zSoWC620uQKBgQDtuHAiOBDi1BE9Rnvv\nXQrSWabnkNkXpxeOW2GC2k7oxyiZOSita4wfYtHe3+2Q4QmlUECHpp4Kt9PGsjsP\nfCv0yIQf2tDwjYTq/r6/CZRh81yld59Jb/SVDW3e2OlRSfFc0+S+Y6yCicvBe5UG\n7YPHhrIjdXLszHfr6BzZLNuBfQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "predictionsapp@predictionsapp-new.iam.gserviceaccount.com",
  "client_id": "103822356126711101434",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/predictionsapp%40predictionsapp-new.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}


-footballAPI _KEY=ab0496f8c413baa9d1b31f4386b04a51

NOtes:
Keep credentials in a .env file
Implement Dotenv file logic so it can be deployed in a production environment

---

# 1. Core Features and Functionalities

## 1.1 Import Fixtures from Football API
###Notes
-Run the script to execute an API call at 5pm EST everyday
-Pull in all the fixtures from League 39 and season 2024

- Users can fetch upcoming matches using the API.
- **API Example**:
  - **Request**:
    ```javascript
    axios.get('/api/matches/upcoming');
    ```
  - **Response**:
    ```json
    [
      {
        "username": "user1",
        "matchId": 1,
        "homeTeam": "Team A",
        "awayTeam": "Team B",
        "homeTeamScore": 1, // this will be the score of the home team
        "awayTeamScore": 2,
        "round": 12,
        "status": "not Started",
        "startTime": "2024-01-15T15:00:00Z"
      }
    ]
    ```
## 1.2 Store the Fixtures in the GoogleSheet "Fixtures" Table
The process for storing fixtures in Airtable follows these steps:

1.2.1. Clear existing data:
   - Fetch all existing records from the "Fixtures" table
   - Use batching wherever possible (https://developers.google.com/sheets/api/guides/batch)
   - Delete records in batches
   - Log the number of records deleted

1.2.2. Import new data:
   - Process fixtures in batches  (https://developers.google.com/sheets/api/guides/batch)
- there will be a maximum number of 380 records for the fixtures
 - Each record contains:
     - fixtureid: unique identifier
     - homeTeam: name of home team
     - awayTeam: name of away team
     - round: match round number
     - status: match status
     - startTime: scheduled start time
     - homeTeamScore: current/final score (if available)
     - awayTeamScore: current/final score (if available)
   - Log successful insertion of new records

1.2.3. Error handling:
   - Comprehensive error logging for both deletion and insertion operations
   - Batch processing ensures reliable operation within API limits
   - Transaction-like behavior: if insertion fails, the process can be safely retried

This process is automatically handled by the updateFixturesInAirtable function and runs as part of the daily fixture update routine.

1.2.4 Additional Information and Documentation

1. Google Sheets API Reference: https://developers.google.com/sheets/api/reference/rest
2. Google Cloud Console: https://console.cloud.google.com/
3. TypeScript Documentation: https://www.typescriptlang.org/docs/
4. Jest Testing Framework: https://jestjs.io/docs/getting-started
5. TypeDoc: https://typedoc.org/guides/installation/


##1.3 import current game week fixtures
-Worksheet 1OJpcocsLUD-5CUGTZcaNJzJ2ZyHw-hG-ryXUo25Ro7E/edit?gid=2008750902#gid=2008750902
Table = predictions
-Columns headers are: Fixture ID, Round, Date, Starttime, Home Team, Away Team,
-Current game week is defined as the lowest numbered round where all fixtures status is NS
-There will be up to 20 fixtures per import
-Add the records to the bottom of the table
-Import the fixtures into the Predictions form
-Include the screenshot

## 1.4 Prediction Submission
-They will predict the number of goals the home team and the away team will score.
-The user will use the predictions page to submit predictions for the score of all fixtures in the next game week
-A game week is also known as round.
- when the user clicks on the submit button the data is sent to the Googelsheets "Predictions" table.
- the column headers are username,fixtureid, home team, away team, home team score, away team score, round
-These predictions will be stores in the googlesheets "predictions' Table
-When the user enters a single numeric character into the input field for a score it will automatically move to the next input field for a score.
-If a user has already submitted predictions for a specific round they will not be able to submit predictions for the same round again.
-If a user has not entered in a score in each field it will not allow them to submit the prediction.

##1.5 Leaderboard
The leaderboard shows the data in the googelsheets "leaderboard" table
It will display record in order of "rank" with lowest number at the top of the table.

—
# 2.UX and Front end

## 2.1 Home Page
- Display a welcome message.
- Provide buttons to:
  - Enter predictions - this will take the user to the user page.
  - View the leaderboard - this will take the user to the leaderboard page.

  ### 2.1.1 User Page
  - the function of this page is to allow the user to select their name from a number of icons displaying one for each name of the players.
  - this will represent to player that the user is predicting for.
- it will include a "Back' button that the user can use to return to the home page
  - there are currently 6 players in the database.
  - the users names are:
    -"David"
    -"Gordon"
    -"Huw"
    -"James"
    -"Tom"
    -"Ty"  
  
## 2.3 Enter Predictions
The logic for this screen will be run everytime the screen loads. 
-Users can enter predictions for all matches in the next round only.
- The fixtures to be displayed are loaded from the "GameWeek" sheet in googlesheets document.
- this sheet should be refreshed everytime before the data is loaded into the application.

  - Matches data will be fetched from the fixtures table via the googlesheets API.
**Layout**
- the screen should contain a "change user" button in the top right of the screen
  - the user name will displayed in the top left of the screen.
  - it will display the home team on the left and the away team on the right with two blank numeric input fields in the middle
  - the user will be able to click on the blank field to enter their prediction.
  - when the user input a single character numeric value into the first blank field, it will move onto the next blank field.-
  - once all the fields are filled the user will be able to click on the submit button to submit their predictions.
  

  ###2.3.1 Submit Predictions
  - the user will be able to click on the submit button to submit their predictions.
  - when they submit their predictions they will be shown a toast notification containing all their predictions in one message so they can take a screen shot.
  - display teh toast notice for 3 seconds before returning the user to the home page.
  - all predictions will be stored in the same googlesheets workbook as the fixtures, on a table titled "predictions". 
  - the predictions table will have the following columns:
    - userName: name of user
    - fixtureId: unique identifier matching the fixtureId in the fixtures table
    - homeTeam: name of home team
    - awayTeam: name of away team
    - homeTeamScore: predicted score of home team
    - awayTeamScore: predicted score of away team
    - round: match round number
    -date
  - note that there are other columns in the table but these are the ones that are to be updated. ignore the existing columns.
  - never write over any existing rows.

## 2.4 View Predictions
- Users can view predictions made by all users for the current game week.
- **Definition of current game week**:
  - The game week with the lowest number where at least one match is scheduled to start later than `NOW` and has a status: `not Started`.

## 2.5.1 Leaderboard page
###2.5.1.1 Layout
 - the leaderboard should follow the same design language and color scheme as the rest of the application.
 - the leaderboard should be responsive and should look good on both laptop and mobile devices.
 - it should contain a "Back" button in the top left of the screen that the user can use to return to the home page.  

 ###2.5.1.2 Table
 - the top frame should be titled "Leaderboard"
 - the top frame should show a table with the following columns:
      - Rank
      - Player
      - Total Points
      - Points from the previous game week
  - the table should be sorted by total points, highest to lowest.
- data to populate this table will come from googlesheets "leaderBoard" sheet.

# 3. Project Setup and Best Practices

## 3.1 Project Setup
- All new components should go in `/components` at the root (not in the app folder) and be named like `example-cor`.
- All new pages go in `/app`.
- Use the Next.js 14 App Router.
- All data fetching should be done in a server component and passed down as props.
- Client components (using `useState`, hooks, etc.) require the `'use client'` directive at the top of the file.

## 3.2 Server-Side API Calls
- All interactions with external APIs (e.g., Reddit, OpenAI) should be performed server-side.
- Create dedicated API routes in the `pages/api` directory for each external API interaction.
- Client-side components should fetch data through these API routes, not directly from external APIs.

## 3.3 Environment Variables
- Store all sensitive information (API keys, credentials) in environment variables.
- Use an `.env.local` file for local development and ensure it is listed in `.gitignore`.
- For production, set environment variables in the deployment platform (e.g., Vercel).
- Access environment variables only in server-side code or API routes.

## 3.4 Error Handling and Logging
- Implement comprehensive error handling in both client-side components and server-side API routes.
- Log errors on the server-side for debugging purposes.
- Display user-friendly error messages on the client-side.

## 3.5 Type Safety
- Use TypeScript interfaces for all data structures, especially API responses.
- Avoid using the `any` type to ensure type safety.

## 3.6 API Client Initialization
- Initialize API clients as needed to streamline server-side interactions and reduce redundancy.


#5 file structure. 
- where possible keep the file structure and organization as simple as possible. 
- here is a suggestion for the file structure. ├── .env.local
```
├── .env.local                    # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── app/                      # Next.js 14 App Router pages
│   │   ├── page.tsx             # Home page
│   │   ├── layout.tsx           # Root layout
│   │   ├── predictions/
│   │   │   ├── page.tsx        # Predictions entry page
│   │   │   └── [round]/
│   │   │       └── page.tsx    # Specific round predictions
│   │   ├── leaderboard/
│   │   │   └── page.tsx        # Leaderboard page
│   │   └── user/
│   │       └── page.tsx        # User selection page
│   │
│   ├── components/              # Reusable components
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── navigation.tsx
│   │   ├── predictions/
│   │   │   ├── prediction-form.tsx
│   │   │   ├── match-card.tsx
│   │   │   └── score-input.tsx
│   │   ├── leaderboard/
│   │   │   └── leaderboard-table.tsx
│   │   └── shared/
│   │       ├── back-button.tsx
│   │       └── user-avatar.tsx
│   │
│   ├── lib/                     # Utility functions and shared logic
│   │   ├── api/                # API client functions
│   │   │   ├── football.ts     # Football API integration
│   │   │   └── sheets.ts       # Google Sheets API integration
│   │   ├── types/             # TypeScript interfaces
│   │   │   ├── fixtures.ts
│   │   │   ├── predictions.ts
│   │   │   └── user.ts
│   │   └── utils/             # Helper functions
│   │       ├── date.ts
│   │       └── validation.ts
│   │
│   ├── config/                 # Configuration files
│   │   ├── constants.ts       # App constants
│   │   └── api-config.ts      # API configuration
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-predictions.ts
│   │   └── use-user.ts
│   │
│   └── styles/                 # Global styles
│       └── globals.css
│
├── public/                     # Static assets
│   └── images/
│       └── avatars/           # User avatar images
│
└── scripts/                   # Utility scripts
    └── update-fixtures.ts     # Daily fixture update script
```

Key organizational principles:

1. **App Directory Structure**
   - All pages are organized under `src/app/` following Next.js 14 App Router conventions
   - Each major feature has its own directory with related components

2. **Components Organization**
   - Components are grouped by feature area (predictions, leaderboard, etc.)
   - Shared components are placed in the `shared` directory
   - Layout components have their own directory

3. **API and Data Handling**
   - API integrations are centralized in `lib/api`
   - TypeScript interfaces are organized in `lib/types`
   - Helper functions are grouped in `lib/utils`

4. **Configuration**
   - Environment variables in `.env.local`
   - Constants and API configuration in `config` directory

5. **Static Assets**
   - All static files (images, icons) are stored in `public`
   - User avatars have a dedicated directory

6. **Utility Scripts**
   - Background jobs and scripts are stored in `scripts`
   - Includes the daily fixture update script

This structure follows React/Next.js best practices and ensures:
- Clear separation of concerns
- Easy navigation and maintenance
- Scalability for future features
- Type safety with TypeScript
- Proper organization of server and client components

#6 # AI Development Agent Guidelines

# AI Development Agent Guidelines

## 1. Changelog Management
Please maintain a detailed changelog in the following format:

```markdown
# Changelog

## [Unreleased]
### Added
- New features that have been added

### Changed
- Changes in existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Security improvements or fixes

Each entry should include:
- Date and time of change
- Brief description of what was changed
- Reason for the change
- File(s) affected
```

#7. Development Process Guidelines

### Before Starting Each Task
1. Review the current state of the codebase
2. Identify dependencies and potential impacts
3. State your planned approach
4. List any assumptions you're making
5. Identify potential risks or challenges

### During Development
1. Write commit messages in present tense, explaining:
   - What changes are being made
   - Why the changes are necessary
   - Any potential side effects

### After Each Major Change
1. Summarize what was completed
2. List any deviations from the original plan
3. Document any technical debt created
4. Suggest next steps or related tasks

## 7.2. Code Organization Rules

### File Structure
- Place new files in appropriate directories as per the project structure
- Update import paths in affected files
- Document new directory creation in changelog

### Component Creation
1. Before creating a component:
   - Check if similar component exists
   - Consider component reusability
   - Plan component interface (props, events)

2. When creating a component:
   - Add TypeScript interfaces
   - Include JSDoc comments
   - Add error handling
   - Consider accessibility



##7.3. Documentation Requirements

### Code Documentation
- Add JSDoc comments for functions and components
- Include type definitions
- Document complex logic or business rules
- Explain any workarounds or temporary solutions

### README Updates
- Document new features
- Update installation steps if needed
- Add new environment variables
- Update troubleshooting guides

## 7.4. Quality Control Checklist

Before marking a task as complete:
- [  ] Code follows TypeScript best practices
- [  ] Proper error handling implemented
- [  ] Changes documented in changelog
- [  ] Components properly typed
- [  ] No unused imports or variables
- [  ] Consistent code formatting
- [  ] Clear and descriptive variable names
- [  ] Updated relevant documentation
- [  ] Considered mobile responsiveness
- [  ] Implemented proper loading states
- [  ] Added error states
- [  ] Considered accessibility

## 7.5. Communication Format

When providing updates, use this structure:

```markdown
## Status Update
Current Task: [Task Name]
Progress: [Percentage]

### Completed
- List of completed items

### In Progress
- Current work items

### Blocked
- Any blockers or challenges

### Next Steps
- Upcoming tasks

### Questions/Concerns
- Any issues needing clarification
```

## 76. Error Handling Standards

Implement error handling following this pattern:
```typescript
try {
  // Operation
} catch (error) {
  // Log error details
  console.error('[Component/Operation]:', error);
  
  // Categorize error
  if (error instanceof NetworkError) {
    // Handle network errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else {
    // Handle unknown errors
  }
  
  // Update error state
  setError({
    message: getErrorMessage(error),
    code: getErrorCode(error),
    context: 'Operation context'
  });
}
```




