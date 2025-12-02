"use client";

import { MaterialParams } from "./MaterialForm";

interface MaterialDisplayProps {
  content: string;
  params: MaterialParams;
  generatedAt: string;
  onExportPDF: () => void;
  onExportMarkdown: () => void;
  onRegenerate: () => void;
}

export const MaterialDisplay = ({
  content,
  params,
  generatedAt,
  onExportPDF,
  onExportMarkdown,
  onRegenerate,
}: MaterialDisplayProps) => {
  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    return text
      .split("\n")
      .map((line, index) => {
        // Headers
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="text-3xl font-bold text-white mt-6 mb-3">
              {line.substring(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="text-2xl font-bold text-white mt-5 mb-2">
              {line.substring(3)}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} className="text-xl font-bold text-white mt-4 mb-2">
              {line.substring(4)}
            </h3>
          );
        }

        // Bold text
        const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

        // Lists
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <li key={index} className="text-white/80 ml-6 mb-1" dangerouslySetInnerHTML={{ __html: boldFormatted }} />
          );
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          return (
            <li
              key={index}
              className="text-white/80 ml-6 mb-1 list-decimal"
              dangerouslySetInnerHTML={{ __html: boldFormatted }}
            />
          );
        }

        // Empty lines
        if (line.trim() === "") {
          return <div key={index} className="h-2" />;
        }

        // Regular paragraphs
        return (
          <p key={index} className="text-white/80 mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: boldFormatted }} />
        );
      });
  };

  const formattedDate = new Date(generatedAt).toLocaleString();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Generated Lesson Plan</h2>
            <p className="text-white/60 text-sm">
              {params.language} • {params.proficiencyLevel} • {params.lessonFocus} •{" "}
              {params.sessionDuration} min
            </p>
            <p className="text-white/40 text-xs mt-1">Generated on {formattedDate}</p>
          </div>
          <button
            onClick={onRegenerate}
            className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors flex items-center gap-1"
          >
            <span>←</span> Regenerate
          </button>
        </div>

        {/* Content */}
        <div className="bg-black/20 rounded-lg p-6 max-h-[600px] overflow-y-auto">
          <div className="prose prose-invert max-w-none">{formatContent(content)}</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={onExportPDF}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-4 px-6 rounded-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span>📄</span>
          Export as PDF
        </button>
        <button
          onClick={onExportMarkdown}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span>📝</span>
          Export as Markdown
        </button>
      </div>
    </div>
  );
};
