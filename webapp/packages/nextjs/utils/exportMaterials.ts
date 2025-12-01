// @ts-ignore - jsPDF types may not be available
import { jsPDF } from "jspdf";
import { MaterialParams } from "~~/components/materials/MaterialForm";

/**
 * Generate a filename for exported materials
 */
export function generateFilename(params: MaterialParams, extension: "pdf" | "md"): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const language = params.language.replace(/\s+/g, "-").toLowerCase();
  const level = params.proficiencyLevel.toLowerCase();

  return `${language}-${level}-${timestamp}.${extension}`;
}

/**
 * Export materials as PDF
 */
export function exportAsPDF(content: string, params: MaterialParams): void {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Lesson Plan", margin, yPosition);
    yPosition += 10;

    // Add metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const metadata = `${params.language} • ${params.proficiencyLevel} • ${params.lessonFocus} • ${params.sessionDuration} min`;
    doc.text(metadata, margin, yPosition);
    yPosition += 10;

    // Add separator line
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Process content
    const lines = content.split("\n");
    doc.setFontSize(11);

    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Handle headers
      if (line.startsWith("# ")) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const text = line.substring(2);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 8 + 5;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
      } else if (line.startsWith("## ")) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const text = line.substring(3);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 7 + 4;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
      } else if (line.startsWith("### ")) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const text = line.substring(4);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 6 + 3;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
      } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        // Bullet points
        const text = line.trim().substring(2);
        const splitText = doc.splitTextToSize(text, maxWidth - 10);
        doc.text("•", margin + 5, yPosition);
        doc.text(splitText, margin + 10, yPosition);
        yPosition += splitText.length * 5 + 2;
      } else if (/^\d+\.\s/.test(line.trim())) {
        // Numbered lists
        const splitText = doc.splitTextToSize(line.trim(), maxWidth - 10);
        doc.text(splitText, margin + 5, yPosition);
        yPosition += splitText.length * 5 + 2;
      } else if (line.trim() === "") {
        // Empty line
        yPosition += 5;
      } else {
        // Regular text
        const cleanText = line.replace(/\*\*(.*?)\*\*/g, "$1"); // Remove bold markers
        const splitText = doc.splitTextToSize(cleanText, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 5 + 2;
      }
    }

    // Save the PDF
    const filename = generateFilename(params, "pdf");
    doc.save(filename);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw new Error("Failed to export PDF. Please try again.");
  }
}

/**
 * Export materials as Markdown
 */
export function exportAsMarkdown(content: string, params: MaterialParams): void {
  try {
    // Add metadata header
    const header = `# Lesson Plan

**Language:** ${params.language}  
**Level:** ${params.proficiencyLevel}  
**Focus:** ${params.lessonFocus}  
**Duration:** ${params.sessionDuration} minutes  
**Generated:** ${new Date().toLocaleString()}

---

`;

    const fullContent = header + content;

    // Create a blob and download
    const blob = new Blob([fullContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFilename(params, "md");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting Markdown:", error);
    throw new Error("Failed to export Markdown. Please try again.");
  }
}
