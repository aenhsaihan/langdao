# AI Teaching Material Preparation

## Overview

The AI Teaching Material Preparation feature allows tutors to generate customized lesson plans using Google's Gemini AI. Tutors can specify the teaching language, student proficiency level, lesson focus, and session duration to receive tailored teaching materials.

## Features

- **AI-Powered Generation**: Uses Gemini API to create structured lesson plans
- **Customizable Parameters**: 
  - Teaching language
  - Proficiency level (Beginner, Intermediate, Advanced)
  - Lesson focus (Conversational, Informational, Daily Life, Grammar, Vocabulary, Pronunciation)
  - Session duration (15, 30, 45, 60, 90 minutes)
- **Export Options**: Download materials as PDF or Markdown
- **Ephemeral Content**: Materials are not stored in the database for privacy
- **Tutor-Only Access**: Only registered tutors can access this feature

## Setup

### Backend Configuration

1. Add your Gemini API key to `backend/.env`:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=model_name
```

2. The backend endpoint is automatically registered at `/api/materials/generate`

### Frontend Configuration

The frontend automatically connects to the backend using the `NEXT_PUBLIC_SOCKET_URL` environment variable.

## Usage

### For Tutors

1. Navigate to your tutor dashboard
2. Click on "Prepare Material with AI"
3. Fill in the form:
   - Select the teaching language
   - Choose student proficiency level
   - Select lesson focus
   - Pick session duration
4. Click "Generate Materials"
5. Review the generated lesson plan
6. Export as PDF or Markdown if desired
7. Click "Regenerate" to create new materials with different parameters

### API Endpoint

**POST** `/api/materials/generate`

**Request Body:**
```json
{
  "language": "Spanish",
  "proficiencyLevel": "Intermediate",
  "lessonFocus": "Conversational",
  "sessionDuration": 60
}
```

**Response:**
```json
{
  "content": "# Lesson Plan\n\n## Learning Objectives...",
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400`: Validation error (missing or invalid parameters)
- `429`: Rate limit exceeded
- `500`: Configuration error or API unavailable
- `503`: AI service temporarily unavailable

## Architecture

### Backend (`backend/src/routes/materials.js`)
- Validates input parameters
- Constructs system prompt for Gemini API
- Makes HTTP request to Gemini API
- Returns generated content
- Handles errors appropriately

### Frontend Components

**`/app/prepare-materials/page.tsx`**
- Main page with route protection
- Manages state for generation and display
- Handles API calls and error states

**`/components/materials/MaterialForm.tsx`**
- Form with dropdowns for all parameters
- Client-side validation
- Loading states during generation

**`/components/materials/MaterialDisplay.tsx`**
- Displays generated content with formatting
- Provides export buttons
- Allows regeneration

**`/utils/exportMaterials.ts`**
- PDF export using jsPDF
- Markdown export with metadata
- Filename generation

## Security

- **API Key Protection**: Gemini API key is stored only in backend environment variables
- **Route Protection**: Only registered tutors can access the feature
- **Rate Limiting**: Backend applies global rate limiting (100 req/min)
- **Input Validation**: All parameters are validated before API calls
- **No Persistence**: Generated materials are not stored in any database

## Error Handling

The system provides specific error messages for different failure scenarios:

- **AI service unavailable**: Gemini API is down
- **Configuration error**: Invalid API key
- **Rate limit exceeded**: Too many requests
- **Connection error**: Network issues
- **Validation errors**: Missing or invalid parameters

## Troubleshooting

### "Configuration error, please contact support"
- Check that `GEMINI_API_KEY` is set in `backend/.env`
- Verify the API key is valid

### "AI service temporarily unavailable"
- Gemini API may be experiencing issues
- Try again in a few minutes

### "Too many requests"
- Wait a few minutes before trying again
- Rate limit is 10 requests per minute per user

### Materials not generating
- Check browser console for errors
- Verify backend is running on port 4000
- Check that `NEXT_PUBLIC_SOCKET_URL` is set correctly

## Future Enhancements

- Save favorite lesson plans
- Share materials with other tutors
- Material templates library
- Multi-language UI support
- Collaborative editing
- Material rating system

## Dependencies

### Backend
- No additional dependencies (uses native `fetch`)

### Frontend
- `jspdf`: ^2.5.2 (PDF generation)

## Testing

To test the feature:

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd webapp/packages/nextjs && yarn dev`
3. Register as a tutor
4. Navigate to `/prepare-materials`
5. Fill in the form and generate materials
6. Test PDF and Markdown export
7. Verify materials are not persisted after page refresh
