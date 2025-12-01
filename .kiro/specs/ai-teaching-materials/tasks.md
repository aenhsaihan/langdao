# Implementation Plan

- [x] 1. Set up backend API endpoint for material generation
  - Create `/api/materials/generate` route in Express backend
  - Add Gemini API key to backend `.env` file
  - Install Google Generative AI SDK (`@google/generative-ai`)
  - Implement request validation (language, level, focus, duration)
  - Construct system prompt from parameters
  - Call Gemini API and return response
  - Add error handling for API failures
  - _Requirements: 6.1, 6.2, 6.3, 12.1, 12.2, 14.1_

- [-] 1.1 Write property test for parameter validation
  - **Property 1: Parameter Validation**
  - **Validates: Requirements 14.1, 14.2**

- [x] 2. Create material preparation page route
  - Create `/app/prepare-materials/page.tsx` in Next.js
  - Add route protection (tutor-only access)
  - Fetch tutor's registered languages from contract
  - Set up page layout with header and container
  - Add navigation link from tutor dashboard
  - _Requirements: 1.1, 1.2, 1.3, 5.1_

- [ ]* 2.1 Write property test for tutor-only access
  - **Property 5: Tutor-Only Access**
  - **Validates: Requirements 1.3, 1.4**

- [x] 3. Build MaterialForm component
  - Create `components/materials/MaterialForm.tsx`
  - Add language dropdown (populated from tutor's languages)
  - Add proficiency level dropdown (Beginner, Intermediate, Advanced)
  - Add lesson focus dropdown (Conversational, Informational, Daily Life, Grammar, Vocabulary, Pronunciation)
  - Add session duration dropdown (15, 30, 45, 60, 90 minutes)
  - Add "Generate Materials" button
  - Implement form validation (all fields required)
  - Show validation errors for missing fields
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 14.2_

- [x] 4. Implement material generation logic
  - Add API call to `/api/materials/generate` from frontend
  - Show loading spinner during generation
  - Disable generate button while loading
  - Handle API response and store in React state
  - Display error messages for failed requests
  - Add retry functionality on errors
  - _Requirements: 6.1, 6.4, 13.1, 13.2, 13.3, 15.5_

- [ ]* 4.1 Write property test for loading state consistency
  - **Property 6: Loading State Consistency**
  - **Validates: Requirements 13.1, 13.2, 13.3**

- [ ]* 4.2 Write property test for error message clarity
  - **Property 7: Error Message Clarity**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

- [x] 5. Create MaterialDisplay component
  - Create `components/materials/MaterialDisplay.tsx`
  - Display generated content with proper formatting
  - Preserve markdown formatting (headings, lists, bold)
  - Add "Regenerate" button to go back to form
  - Show generation timestamp
  - Make content scrollable if long
  - _Requirements: 8.1, 8.2, 8.4, 18.1_

- [x] 6. Build ExportButtons component
  - Create `components/materials/ExportButtons.tsx`
  - Add "Export as PDF" button
  - Add "Export as Markdown" button
  - Style buttons with consistent design
  - Show loading state during export
  - _Requirements: 8.3, 9.1, 10.1_

- [x] 7. Implement PDF export functionality
  - Install `jspdf` library
  - Convert generated content to PDF format
  - Generate filename: `{language}-{level}-{timestamp}.pdf`
  - Trigger browser download
  - Handle PDF generation errors
  - Preserve formatting in PDF (headings, lists)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 7.1 Write property test for filename consistency
  - **Property 4: Export Filename Consistency**
  - **Validates: Requirements 9.3, 10.3**

- [x] 8. Implement Markdown export functionality
  - Convert generated content to Markdown format
  - Generate filename: `{language}-{level}-{timestamp}.md`
  - Trigger browser download
  - Handle Markdown export errors
  - Preserve markdown syntax
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9. Ensure ephemeral content handling
  - Store generated materials only in React state
  - Clear state on page navigation
  - Verify no localStorage/sessionStorage usage
  - Verify no database writes
  - Test content is lost on browser close
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 9.1 Write property test for ephemeral state
  - **Property 3: Ephemeral Content**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [x] 10. Add error handling and user feedback
  - Implement specific error messages for each failure type
  - Add retry buttons for recoverable errors
  - Show "AI service unavailable" for Gemini API errors
  - Show "Rate limit exceeded" with wait time
  - Show "Network error" for connection issues
  - Show "Configuration error" for API key issues
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 11. Implement responsive design
  - Make form mobile-friendly (vertical stacking)
  - Use responsive dropdowns for mobile
  - Adjust typography for small screens
  - Test on mobile devices (iOS and Android)
  - Ensure export works on mobile browsers
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 12. Add API security and rate limiting
  - Verify API key is never exposed to client
  - Add rate limiting to generation endpoint (10 req/min)
  - Implement input sanitization to prevent prompt injection
  - Configure CORS for frontend origin only
  - Add request logging for debugging
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 12.1 Write property test for API key security
  - **Property 2: API Key Security**
  - **Validates: Requirements 12.1, 12.2, 12.5**

- [x] 13. Checkpoint - Ensure all tests pass, ask the user if questions arise

- [x] 14. Final integration and polish
  - Test complete flow: dashboard → form → generate → display → export
  - Verify all error scenarios work correctly
  - Test regeneration functionality
  - Verify mobile responsiveness
  - Add loading states and transitions
  - Polish UI styling and spacing
  - _Requirements: All_

- [ ]* 14.1 Write integration tests for full flow
  - Test form submission → API call → display → export
  - Test error handling with mocked API failures
  - Test export functionality with sample content

- [x] 15. Documentation and deployment
  - Add README for material preparation feature
  - Document Gemini API setup instructions
  - Add environment variable documentation
  - Update tutor dashboard documentation
  - Deploy to staging for testing
