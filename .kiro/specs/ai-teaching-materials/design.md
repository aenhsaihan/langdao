# Design Document

## Overview

The AI Teaching Material Preparation feature adds a simple page where tutors can generate lesson plans using Google's Gemini API. The tutor selects a few parameters (language, level, focus, duration), clicks generate, and receives a teaching guide they can export as PDF or Markdown. No data is stored - everything is ephemeral and lives only in the browser session.

## Architecture

### High-Level Flow

```
Tutor Dashboard → Material Prep Page → Select Parameters → Generate (API Call) → Display Materials → Export (PDF/MD) → Done
```

### Components

**Frontend (Next.js)**:
- `/app/prepare-materials/page.tsx` - Main material preparation page
- `/components/materials/MaterialForm.tsx` - Form with dropdowns
- `/components/materials/MaterialDisplay.tsx` - Shows generated content
- `/components/materials/ExportButtons.tsx` - PDF and Markdown export

**Backend (Express.js)**:
- `POST /api/materials/generate` - Proxies request to Gemini API
- Validates inputs, constructs prompt, returns generated content

**External**:
- Gemini API - Generates teaching materials based on prompt

### Data Flow

1. Tutor fills form → Frontend validates
2. Frontend sends POST to backend with parameters
3. Backend constructs system prompt
4. Backend calls Gemini API
5. Backend returns generated materials
6. Frontend displays materials in browser
7. Tutor clicks export → Browser downloads file
8. Tutor leaves page → Content discarded

## Components and Interfaces

### Frontend Components

**MaterialForm Component**:
```typescript
interface MaterialFormProps {
  tutorLanguages: string[];
  onGenerate: (params: MaterialParams) => void;
  isLoading: boolean;
}

interface MaterialParams {
  language: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  lessonFocus: 'Conversational' | 'Informational' | 'Daily Life' | 'Grammar' | 'Vocabulary' | 'Pronunciation';
  sessionDuration: 15 | 30 | 45 | 60 | 90;
}
```

**MaterialDisplay Component**:
```typescript
interface MaterialDisplayProps {
  content: string;
  onExportPDF: () => void;
  onExportMarkdown: () => void;
  onRegenerate: () => void;
}
```

### Backend API

**Generate Materials Endpoint**:
```typescript
POST /api/materials/generate
Request Body: {
  language: string;
  proficiencyLevel: string;
  lessonFocus: string;
  sessionDuration: number;
}
Response: {
  content: string;
  generatedAt: string;
}
```

### Gemini API Integration

**System Prompt Template**:
```
You are an expert language teacher creating a lesson plan.

Teaching Language: {language}
Student Level: {proficiencyLevel}
Lesson Focus: {lessonFocus}
Session Duration: {sessionDuration} minutes

Create a structured lesson plan with:
1. Learning objectives (2-3 clear goals)
2. Warm-up activity (5 minutes)
3. Main activities (with timing)
4. Practice exercises
5. Wrap-up and homework suggestions

Format the response in clear sections with headings.
```

## Data Models

### MaterialParams (Frontend State)
```typescript
{
  language: string;           // e.g., "Spanish"
  proficiencyLevel: string;   // "Beginner" | "Intermediate" | "Advanced"
  lessonFocus: string;        // "Conversational" | "Informational" | etc.
  sessionDuration: number;    // 15 | 30 | 45 | 60 | 90
}
```

### GeneratedMaterial (Ephemeral)
```typescript
{
  content: string;            // Markdown-formatted lesson plan
  generatedAt: Date;          // Timestamp for filename
  params: MaterialParams;     // Original parameters
}
```

**Note**: No database models - everything is ephemeral and stored only in React state.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parameter Validation
*For any* material generation request, all required parameters (language, proficiency level, lesson focus, session duration) must be present and valid before the API call is made.
**Validates: Requirements 14.1, 14.2**

### Property 2: API Key Security
*For any* material generation request, the Gemini API key must never be exposed to the client and must only be used server-side.
**Validates: Requirements 12.1, 12.2, 12.5**

### Property 3: Ephemeral Content
*For any* generated material, when the user navigates away from the page or closes the browser, the content must not persist in any database or storage.
**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 4: Export Filename Consistency
*For any* exported file (PDF or Markdown), the filename must include the teaching language, proficiency level, and timestamp in a consistent format.
**Validates: Requirements 9.3, 10.3**

### Property 5: Tutor-Only Access
*For any* user attempting to access the material preparation page, if they are not a registered tutor, they must be redirected to the home page.
**Validates: Requirements 1.3, 1.4**

### Property 6: Loading State Consistency
*For any* material generation request, the generate button must be disabled and a loading indicator must be shown until the request completes or fails.
**Validates: Requirements 13.1, 13.2, 13.3**

### Property 7: Error Message Clarity
*For any* failed generation request, the system must display a specific error message based on the failure type (API unavailable, rate limit, network error, etc.).
**Validates: Requirements 15.1, 15.2, 15.3, 15.4**

## Error Handling

### API Errors
- **Gemini API Unavailable**: Show "AI service temporarily unavailable" + retry button
- **Invalid API Key**: Show "Configuration error, contact support" (admin issue)
- **Rate Limit Exceeded**: Show "Too many requests, try again in X minutes"
- **Network Error**: Show "Connection error, check your internet" + retry button

### Validation Errors
- **Missing Parameters**: Highlight missing fields in red
- **Invalid Language**: Show "Please select a valid teaching language"
- **Invalid Duration**: Show "Please select a session duration"

### Export Errors
- **PDF Generation Failed**: Show error + suggest Markdown export
- **Markdown Export Failed**: Show error + allow retry

## Testing Strategy

### Unit Tests
- Test parameter validation logic
- Test system prompt construction
- Test filename generation
- Test error message selection

### Property-Based Tests
We'll use **fast-check** (JavaScript property testing library) with 100 iterations per test.

**Property Test 1: Parameter Validation**
- Generate random combinations of parameters
- Verify validation correctly identifies missing/invalid parameters
- **Validates Property 1**

**Property Test 2: Filename Generation**
- Generate random material parameters and timestamps
- Verify filenames always include language, level, and timestamp
- Verify filenames are valid across operating systems
- **Validates Property 4**

**Property Test 3: Ephemeral State**
- Generate materials with random parameters
- Simulate page navigation
- Verify no data persists in localStorage, sessionStorage, or cookies
- **Validates Property 3**

### Integration Tests
- Test full flow: form submission → API call → display → export
- Test error handling with mocked API failures
- Test export functionality with sample content

### Manual Testing
- Test on mobile devices (responsive design)
- Test PDF export in different browsers
- Test Markdown export and verify formatting
- Test with actual Gemini API responses

## Implementation Notes

### Technology Choices
- **PDF Generation**: Use `jsPDF` library (client-side)
- **Markdown Export**: Simple text file download (no library needed)
- **API Client**: Use `fetch` with error handling
- **Form State**: React `useState` (no form library needed)

### Environment Variables
```bash
# Backend .env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
```

### File Structure
```
webapp/packages/nextjs/
├── app/
│   └── prepare-materials/
│       └── page.tsx
├── components/
│   └── materials/
│       ├── MaterialForm.tsx
│       ├── MaterialDisplay.tsx
│       └── ExportButtons.tsx
└── utils/
    └── gemini.ts

backend/
└── src/
    └── routes/
        └── materials.js
```

### Security Considerations
- API key stored in backend environment variables only
- Rate limiting on generation endpoint (10 requests per minute per user)
- Input sanitization to prevent prompt injection
- CORS configured to only allow frontend origin

### Performance Considerations
- Gemini API typically responds in 2-5 seconds
- Show loading state immediately on button click
- Debounce regenerate button to prevent spam
- Cache nothing (ephemeral by design)

## Future Enhancements (Out of Scope)

- Save favorite lesson plans (requires database)
- Share materials with other tutors
- Material templates library
- Multi-language UI (currently English only)
- Collaborative editing
- Material rating system
