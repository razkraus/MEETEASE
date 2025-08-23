# MeetEase

This app is a Vite + React application configured to run **entirely in the browser** using localStorage. All
former Base44 SDK calls have been replaced with lightweight stubs so the project runs without any external
services.

## Running the app

```bash
npm install
npm run dev
```

## Building the app

```bash
npm run build
```

## Quality checks

```bash
npm test
npm run lint
```

These commands run the built-in unit tests (using the Node test runner) and the ESLint linter.

## Calendar integrations

Use the "Add to Google Calendar" and "Add to Outlook" buttons shown after creating a meeting to quickly place the event on your personal calendar. These helpers open the appropriate provider in a new tab using only client-side code.

For more information and support, please contact the project maintainers.
