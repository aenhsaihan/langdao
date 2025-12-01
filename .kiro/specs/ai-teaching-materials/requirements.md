# Requirements Document

## Introduction

The AI Teaching Material Preparation feature enables tutors to generate customized teaching materials using AI (Gemini API) based on student proficiency level, lesson focus, and session duration. This feature provides tutors with structured lesson plans and teaching guides that can be exported as PDF or Markdown, helping them prepare effective lessons without requiring persistent storage of generated content.

## Glossary

- **Tutor**: A registered user who teaches languages on the LangDAO platform
- **Teaching Material**: AI-generated lesson plan or teaching guide for a tutoring session
- **Gemini API**: Google's generative AI API used to create teaching materials
- **Proficiency Level**: The student's language skill level (Beginner, Intermediate, Advanced)
- **Lesson Focus**: The primary objective of the lesson (Conversational, Informational, Daily Life, Grammar, Vocabulary, Pronunciation)
- **Session Duration**: The planned length of the tutoring session in minutes
- **Teaching Language**: The language the tutor will teach (from tutor's registered languages)
- **System Prompt**: The structured prompt sent to Gemini API containing lesson parameters
- **Export Format**: The file format for downloading materials (PDF or Markdown)
- **Ephemeral Content**: Generated content that is not stored in the database after export
- **Material Generator**: The component that interfaces with Gemini API to create teaching content

## Requirements

### Requirement 1: Access to Material Preparation

**User Story:** As a tutor, I want to access the AI material preparation tool from my dashboard, so that I can create lesson plans before teaching sessions.

#### Acceptance Criteria

1. WHEN a tutor views their dashboard THEN the System SHALL display a "Prepare Material with AI" button
2. WHEN a tutor clicks "Prepare Material with AI" THEN the System SHALL navigate to the material preparation page
3. WHEN a non-tutor user attempts to access the material preparation page THEN the System SHALL redirect to the home page
4. WHEN a tutor is not registered THEN the System SHALL not display the material preparation option
5. WHERE a tutor has multiple registered languages THEN the System SHALL allow material preparation for any of them

### Requirement 2: Teaching Language Selection

**User Story:** As a tutor, I want to select which language I'm preparing materials for, so that the AI generates content in the correct language.

#### Acceptance Criteria

1. WHEN a tutor accesses the material preparation page THEN the System SHALL display the tutor's registered teaching languages
2. WHEN a tutor has only one registered language THEN the System SHALL pre-select that language
3. WHEN a tutor has multiple registered languages THEN the System SHALL display a dropdown with all registered languages
4. WHEN a tutor selects a teaching language THEN the System SHALL update the material generation context
5. WHERE the teaching language is selected THEN the System SHALL generate materials appropriate for teaching that language

### Requirement 3: Proficiency Level Selection

**User Story:** As a tutor, I want to specify the student's proficiency level, so that the AI generates appropriately challenging materials.

#### Acceptance Criteria

1. WHEN a tutor accesses the material preparation page THEN the System SHALL display a proficiency level dropdown
2. WHEN the proficiency dropdown is opened THEN the System SHALL show three options: Beginner, Intermediate, Advanced
3. WHEN a tutor selects a proficiency level THEN the System SHALL store the selection for material generation
4. WHEN no proficiency level is selected THEN the System SHALL prevent material generation
5. WHERE the proficiency level is Beginner THEN the Material Generator SHALL create simplified content with basic vocabulary

### Requirement 4: Lesson Focus Selection

**User Story:** As a tutor, I want to choose the lesson focus, so that the AI generates materials aligned with my teaching goals.

#### Acceptance Criteria

1. WHEN a tutor accesses the material preparation page THEN the System SHALL display a lesson focus dropdown
2. WHEN the focus dropdown is opened THEN the System SHALL show options: Conversational, Informational, Daily Life, Grammar, Vocabulary, Pronunciation
3. WHEN a tutor selects a lesson focus THEN the System SHALL store the selection for material generation
4. WHEN no lesson focus is selected THEN the System SHALL prevent material generation
5. WHERE the focus is Conversational THEN the Material Generator SHALL emphasize dialogue practice and speaking exercises

### Requirement 5: Session Duration Selection

**User Story:** As a tutor, I want to specify the planned session duration, so that the AI generates materials that fit within my time constraints.

#### Acceptance Criteria

1. WHEN a tutor accesses the material preparation page THEN the System SHALL display a session duration dropdown
2. WHEN the duration dropdown is opened THEN the System SHALL show options: 15 minutes, 30 minutes, 45 minutes, 60 minutes, 90 minutes
3. WHEN a tutor selects a session duration THEN the System SHALL store the selection for material generation
4. WHEN no session duration is selected THEN the System SHALL prevent material generation
5. WHERE the duration is 15 minutes THEN the Material Generator SHALL create concise materials with fewer activities

### Requirement 6: Material Generation

**User Story:** As a tutor, I want to generate teaching materials with AI, so that I have a structured lesson plan to follow.

#### Acceptance Criteria

1. WHEN all required fields are selected THEN the System SHALL enable the "Generate Materials" button
2. WHEN a tutor clicks "Generate Materials" THEN the System SHALL construct a system prompt with all selected parameters
3. WHEN the system prompt is ready THEN the Material Generator SHALL send the request to Gemini API
4. WHEN Gemini API responds THEN the System SHALL display the generated teaching materials
5. WHEN material generation fails THEN the System SHALL display an error message and allow retry

### Requirement 7: System Prompt Construction

**User Story:** As a system, I want to construct effective prompts for Gemini API, so that generated materials are relevant and high-quality.

#### Acceptance Criteria

1. WHEN constructing a system prompt THEN the Material Generator SHALL include the teaching language
2. WHEN constructing a system prompt THEN the Material Generator SHALL include the proficiency level
3. WHEN constructing a system prompt THEN the Material Generator SHALL include the lesson focus
4. WHEN constructing a system prompt THEN the Material Generator SHALL include the session duration
5. WHERE all parameters are included THEN the Material Generator SHALL request structured lesson plans with objectives, activities, and timing

### Requirement 8: Material Display

**User Story:** As a tutor, I want to preview the generated materials, so that I can review them before exporting.

#### Acceptance Criteria

1. WHEN materials are generated THEN the System SHALL display the content in a readable format
2. WHEN materials are displayed THEN the System SHALL show lesson objectives, activities, and timing breakdown
3. WHEN materials are displayed THEN the System SHALL provide export options (PDF and Markdown)
4. WHEN materials are displayed THEN the System SHALL allow regeneration with different parameters
5. WHERE materials contain special formatting THEN the System SHALL preserve formatting in the display

### Requirement 9: PDF Export

**User Story:** As a tutor, I want to export materials as PDF, so that I can print or share them easily.

#### Acceptance Criteria

1. WHEN a tutor clicks "Export as PDF" THEN the System SHALL convert the generated materials to PDF format
2. WHEN PDF conversion is complete THEN the System SHALL trigger a browser download
3. WHEN the PDF is downloaded THEN the System SHALL name the file with teaching language, level, and timestamp
4. WHEN PDF export fails THEN the System SHALL display an error message and suggest Markdown export
5. WHERE materials contain formatting THEN the PDF SHALL preserve headings, lists, and emphasis

### Requirement 10: Markdown Export

**User Story:** As a tutor, I want to export materials as Markdown, so that I can edit them in my preferred text editor.

#### Acceptance Criteria

1. WHEN a tutor clicks "Export as Markdown" THEN the System SHALL convert the generated materials to Markdown format
2. WHEN Markdown conversion is complete THEN the System SHALL trigger a browser download
3. WHEN the Markdown is downloaded THEN the System SHALL name the file with teaching language, level, and timestamp
4. WHEN Markdown export fails THEN the System SHALL display an error message
5. WHERE materials contain formatting THEN the Markdown SHALL use standard Markdown syntax

### Requirement 11: Ephemeral Content Management

**User Story:** As a system, I want to avoid storing generated materials, so that we minimize storage costs and privacy concerns.

#### Acceptance Criteria

1. WHEN materials are generated THEN the System SHALL store them only in browser memory
2. WHEN a tutor navigates away from the page THEN the System SHALL discard the generated materials
3. WHEN a tutor exports materials THEN the System SHALL not save them to the database
4. WHEN a tutor closes the browser THEN the System SHALL not persist any generated content
5. WHERE materials are needed again THEN the System SHALL require regeneration with the same parameters

### Requirement 12: API Key Management

**User Story:** As a system administrator, I want to securely manage the Gemini API key, so that it's not exposed to users.

#### Acceptance Criteria

1. WHEN the Material Generator makes API calls THEN the System SHALL use the API key from environment variables
2. WHEN the frontend requests material generation THEN the System SHALL proxy the request through the backend
3. WHEN the API key is invalid THEN the System SHALL return an appropriate error message
4. WHEN API rate limits are reached THEN the System SHALL inform the tutor and suggest trying later
5. WHERE the API key is stored THEN the System SHALL never expose it in client-side code

### Requirement 13: Loading States and Feedback

**User Story:** As a tutor, I want to see loading indicators during generation, so that I know the system is working.

#### Acceptance Criteria

1. WHEN material generation starts THEN the System SHALL display a loading spinner
2. WHEN material generation is in progress THEN the System SHALL disable the generate button
3. WHEN material generation completes THEN the System SHALL hide the loading spinner
4. WHEN generation takes longer than 5 seconds THEN the System SHALL display a progress message
5. WHERE generation fails THEN the System SHALL display a clear error message with retry option

### Requirement 14: Input Validation

**User Story:** As a system, I want to validate all inputs before generation, so that API calls are not wasted on invalid requests.

#### Acceptance Criteria

1. WHEN a tutor attempts to generate materials THEN the System SHALL verify all required fields are selected
2. WHEN required fields are missing THEN the System SHALL highlight the missing fields
3. WHEN the teaching language is invalid THEN the System SHALL prevent generation
4. WHEN the session duration is invalid THEN the System SHALL prevent generation
5. WHERE all validations pass THEN the System SHALL proceed with material generation

### Requirement 15: Error Handling

**User Story:** As a tutor, I want clear error messages when generation fails, so that I know what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN Gemini API is unavailable THEN the System SHALL display "AI service temporarily unavailable"
2. WHEN the API key is invalid THEN the System SHALL display "Configuration error, please contact support"
3. WHEN rate limits are exceeded THEN the System SHALL display "Too many requests, please try again in a few minutes"
4. WHEN network errors occur THEN the System SHALL display "Connection error, please check your internet"
5. WHERE errors are recoverable THEN the System SHALL provide a retry button

### Requirement 16: Responsive Design

**User Story:** As a tutor, I want the material preparation page to work on mobile devices, so that I can prepare lessons on the go.

#### Acceptance Criteria

1. WHEN a tutor accesses the page on mobile THEN the System SHALL display a mobile-optimized layout
2. WHEN dropdowns are opened on mobile THEN the System SHALL use native mobile selectors
3. WHEN materials are displayed on mobile THEN the System SHALL use responsive typography
4. WHEN export buttons are clicked on mobile THEN the System SHALL trigger mobile-appropriate downloads
5. WHERE screen size is small THEN the System SHALL stack form elements vertically

### Requirement 17: Material Quality Guidelines

**User Story:** As a system, I want to ensure generated materials meet quality standards, so that tutors receive useful content.

#### Acceptance Criteria

1. WHEN materials are generated THEN the Material Generator SHALL include clear learning objectives
2. WHEN materials are generated THEN the Material Generator SHALL provide time-appropriate activities
3. WHEN materials are generated THEN the Material Generator SHALL include example dialogues or exercises
4. WHEN materials are generated THEN the Material Generator SHALL suggest assessment methods
5. WHERE the proficiency level is specified THEN the Material Generator SHALL use vocabulary appropriate to that level

### Requirement 18: Regeneration Capability

**User Story:** As a tutor, I want to regenerate materials with different parameters, so that I can explore various lesson approaches.

#### Acceptance Criteria

1. WHEN materials are displayed THEN the System SHALL show a "Regenerate" button
2. WHEN a tutor clicks "Regenerate" THEN the System SHALL allow changing any parameter
3. WHEN parameters are changed THEN the System SHALL discard previous materials
4. WHEN regeneration is requested THEN the System SHALL make a new API call with updated parameters
5. WHERE regeneration fails THEN the System SHALL preserve the previous materials until successful generation
