"use client";

import { useState } from "react";

export interface MaterialParams {
  language: string;
  proficiencyLevel: "Beginner" | "Intermediate" | "Advanced";
  lessonFocus: "Conversational" | "Informational" | "Daily Life" | "Grammar" | "Vocabulary" | "Pronunciation";
  sessionDuration: 15 | 30 | 45 | 60 | 90;
}

interface MaterialFormProps {
  tutorLanguages: string[];
  onGenerate: (params: MaterialParams) => void;
  isLoading: boolean;
}

export const MaterialForm = ({ tutorLanguages, onGenerate, isLoading }: MaterialFormProps) => {
  const [language, setLanguage] = useState<string>(tutorLanguages[0] || "");
  const [proficiencyLevel, setProficiencyLevel] = useState<MaterialParams["proficiencyLevel"] | "">("");
  const [lessonFocus, setLessonFocus] = useState<MaterialParams["lessonFocus"] | "">("");
  const [sessionDuration, setSessionDuration] = useState<MaterialParams["sessionDuration"] | "">("");
  const [errors, setErrors] = useState<string[]>([]);

  const proficiencyLevels: MaterialParams["proficiencyLevel"][] = ["Beginner", "Intermediate", "Advanced"];
  const lessonFoci: MaterialParams["lessonFocus"][] = [
    "Conversational",
    "Informational",
    "Daily Life",
    "Grammar",
    "Vocabulary",
    "Pronunciation",
  ];
  const sessionDurations: MaterialParams["sessionDuration"][] = [15, 30, 45, 60, 90];

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!language) newErrors.push("Please select a teaching language");
    if (!proficiencyLevel) newErrors.push("Please select a proficiency level");
    if (!lessonFocus) newErrors.push("Please select a lesson focus");
    if (!sessionDuration) newErrors.push("Please select a session duration");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onGenerate({
      language,
      proficiencyLevel: proficiencyLevel as MaterialParams["proficiencyLevel"],
      lessonFocus: lessonFocus as MaterialParams["lessonFocus"],
      sessionDuration: sessionDuration as MaterialParams["sessionDuration"],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-400 font-semibold mb-2">Please fix the following errors:</div>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-300 text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Teaching Language */}
      <div>
        <label htmlFor="language" className="block text-white font-semibold mb-2">
          Teaching Language
        </label>
        <select
          id="language"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          disabled={isLoading}
          className={`w-full bg-white/10 border ${
            errors.some(e => e.includes("language")) ? "border-red-500" : "border-white/20"
          } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {tutorLanguages.map(lang => (
            <option key={lang} value={lang} className="bg-[#1A0B2E] text-white">
              {lang}
            </option>
          ))}
        </select>
        <p className="text-white/40 text-xs mt-1">The language you'll be teaching</p>
      </div>

      {/* Proficiency Level */}
      <div>
        <label htmlFor="proficiencyLevel" className="block text-white font-semibold mb-2">
          Student Proficiency Level
        </label>
        <select
          id="proficiencyLevel"
          value={proficiencyLevel}
          onChange={e => setProficiencyLevel(e.target.value as MaterialParams["proficiencyLevel"])}
          disabled={isLoading}
          className={`w-full bg-white/10 border ${
            errors.some(e => e.includes("proficiency")) ? "border-red-500" : "border-white/20"
          } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="" className="bg-[#1A0B2E] text-white/60">
            Select level...
          </option>
          {proficiencyLevels.map(level => (
            <option key={level} value={level} className="bg-[#1A0B2E] text-white">
              {level}
            </option>
          ))}
        </select>
        <p className="text-white/40 text-xs mt-1">How advanced is your student?</p>
      </div>

      {/* Lesson Focus */}
      <div>
        <label htmlFor="lessonFocus" className="block text-white font-semibold mb-2">
          Lesson Focus
        </label>
        <select
          id="lessonFocus"
          value={lessonFocus}
          onChange={e => setLessonFocus(e.target.value as MaterialParams["lessonFocus"])}
          disabled={isLoading}
          className={`w-full bg-white/10 border ${
            errors.some(e => e.includes("focus")) ? "border-red-500" : "border-white/20"
          } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="" className="bg-[#1A0B2E] text-white/60">
            Select focus...
          </option>
          {lessonFoci.map(focus => (
            <option key={focus} value={focus} className="bg-[#1A0B2E] text-white">
              {focus}
            </option>
          ))}
        </select>
        <p className="text-white/40 text-xs mt-1">What should the lesson emphasize?</p>
      </div>

      {/* Session Duration */}
      <div>
        <label htmlFor="sessionDuration" className="block text-white font-semibold mb-2">
          Session Duration
        </label>
        <select
          id="sessionDuration"
          value={sessionDuration}
          onChange={e => setSessionDuration(Number(e.target.value) as MaterialParams["sessionDuration"])}
          disabled={isLoading}
          className={`w-full bg-white/10 border ${
            errors.some(e => e.includes("duration")) ? "border-red-500" : "border-white/20"
          } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="" className="bg-[#1A0B2E] text-white/60">
            Select duration...
          </option>
          {sessionDurations.map(duration => (
            <option key={duration} value={duration} className="bg-[#1A0B2E] text-white">
              {duration} minutes
            </option>
          ))}
        </select>
        <p className="text-white/40 text-xs mt-1">How long will the session be?</p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating Materials...
          </>
        ) : (
          <>
            <span>🤖</span>
            Generate Materials
          </>
        )}
      </button>
    </form>
  );
};
