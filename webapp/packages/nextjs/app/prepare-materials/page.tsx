"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { AuthGuard } from "~~/components/auth/AuthGuard";
import { MaterialDisplay } from "~~/components/materials/MaterialDisplay";
import { MaterialForm, MaterialParams } from "~~/components/materials/MaterialForm";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { LANGUAGES } from "~~/lib/constants/contracts";
import { exportAsMarkdown, exportAsPDF } from "~~/utils/exportMaterials";

interface GeneratedMaterial {
  content: string;
  generatedAt: string;
  params: MaterialParams;
}

export default function PrepareMaterialsPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const [isCheckingTutor, setIsCheckingTutor] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMaterial, setGeneratedMaterial] = useState<GeneratedMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tutorLanguages, setTutorLanguages] = useState<string[]>([]);

  // Check if user is a registered tutor
  // Query is automatically disabled when account?.address is undefined
  const {
    data: tutorInfo,
    isLoading: isLoadingTutorInfo,
    isError: isTutorInfoError,
  } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "getTutorInfo",
    args: [account?.address],
  });

  const isRegistered = tutorInfo ? tutorInfo[2] : false;

  // Check if query can actually run (account address must be available)
  const canQueryTutorInfo = !!account?.address;

  // Read which languages the tutor offers (check all languages from LANGUAGES constant)
  // Note: LANGUAGES is a constant array, so the hook count is always the same
  const tutorLanguageChecks = LANGUAGES.map(lang =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useScaffoldReadContract({
      contractName: "LangDAO",
      functionName: "getTutorLanguage",
      args: [account?.address, lang.id],
    }),
  );

  // Get tutor's registered languages from blockchain (memoized to prevent infinite loops)
  const tutorRegisteredLanguages = useMemo(
    () => LANGUAGES.filter((lang, index) => tutorLanguageChecks[index].data === true),
    [tutorLanguageChecks],
  );

  // Get language names as a stable string for dependency comparison
  const tutorLanguageNames = useMemo(
    () =>
      tutorRegisteredLanguages
        .map(lang => lang.name)
        .sort()
        .join(","),
    [tutorRegisteredLanguages],
  );

  // Update tutorLanguages state with language names
  useEffect(() => {
    if (isRegistered && tutorRegisteredLanguages.length > 0) {
      const languageNames = tutorRegisteredLanguages.map(lang => lang.name);
      setTutorLanguages(languageNames);
      console.log("📚 Tutor registered languages from blockchain:", languageNames);
    } else if (isRegistered && tutorRegisteredLanguages.length === 0) {
      // If tutor is registered but has no languages, show empty array
      setTutorLanguages([]);
      console.warn("⚠️ Tutor is registered but has no languages registered on-chain");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegistered, tutorLanguageNames]);

  useEffect(() => {
    console.log("🔍 Tutor check:", {
      hasAccount: !!account,
      accountAddress: account?.address,
      canQueryTutorInfo,
      tutorInfo,
      isLoadingTutorInfo,
      isTutorInfoError,
      isRegistered,
    });

    // Wait for account to be loaded
    if (!account) {
      setIsCheckingTutor(true);
      return;
    }

    // Wait for account address to be available (query can run)
    if (!account?.address) {
      setIsCheckingTutor(true);
      return;
    }

    // Wait for query to complete (either with data, error, or failed)
    // Only proceed when query is not loading AND query was enabled (canQueryTutorInfo)
    if (!isLoadingTutorInfo && canQueryTutorInfo) {
      // If query completed with an error, don't redirect (allow access for now)
      if (isTutorInfoError) {
        console.warn("⚠️ Error querying tutor info, allowing access");
        setIsCheckingTutor(false);
        return;
      }

      // Redirect non-tutors to tutor mode page
      // Only redirect if we have a definitive answer (tutorInfo is not undefined)
      if (tutorInfo !== undefined && !isRegistered) {
        console.log("❌ User is not a registered tutor, redirecting to /tutor");
        router.push("/tutor");
        return;
      } else if (tutorInfo !== undefined && isRegistered) {
        console.log("✅ User is a registered tutor, allowing access");
        setIsCheckingTutor(false);
      } else {
        // tutorInfo is undefined but query completed - this shouldn't happen normally
        // but if it does, wait a bit more or allow access
        console.warn("⚠️ Query completed but tutorInfo is undefined, allowing access");
        setIsCheckingTutor(false);
      }
    }
  }, [
    account,
    account?.address,
    canQueryTutorInfo,
    isLoadingTutorInfo,
    isTutorInfoError,
    tutorInfo,
    isRegistered,
    router,
  ]);

  const handleGenerate = async (params: MaterialParams) => {
    setIsGenerating(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      const url = `${backendUrl}/api/materials/generate`;

      console.log("🚀 Generating materials with params:", params);
      console.log("🌐 Backend URL:", backendUrl);
      console.log("📡 Request URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = "Failed to generate materials";
        try {
          const errorData = await response.json();
          console.error("❌ Error response:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
          const text = await response.text().catch(() => "");
          console.error("❌ Raw error response:", text);
          errorMessage = text || `Server returned ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Materials generated successfully:", data.content?.substring(0, 100) + "...");

      setGeneratedMaterial({
        content: data.content,
        generatedAt: data.generatedAt,
        params,
      });
    } catch (err: any) {
      console.error("❌ Error generating materials:", err);
      const errorMessage = err.message || "Failed to generate materials. Please try again.";
      console.error("💬 Error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedMaterial(null);
    setError(null);
  };

  const handleExportPDF = () => {
    if (!generatedMaterial) return;

    try {
      exportAsPDF(generatedMaterial.content, generatedMaterial.params);
    } catch (err: any) {
      setError(err.message || "Failed to export PDF");
    }
  };

  const handleExportMarkdown = () => {
    if (!generatedMaterial) return;

    try {
      exportAsMarkdown(generatedMaterial.content, generatedMaterial.params);
    } catch (err: any) {
      setError(err.message || "Failed to export Markdown");
    }
  };

  // Show loading while checking tutor status
  if (isCheckingTutor) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#0F0520] via-[#1A0B2E] to-[#0F0520] flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </AuthGuard>
    );
  }

  // Don't render anything if not a tutor (will redirect)
  if (!isRegistered) {
    return null;
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#0F0520] via-[#1A0B2E] to-[#0F0520] p-6 sm:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/tutor")}
              className="text-white/60 hover:text-white mb-4 flex items-center gap-2 transition-colors"
            >
              <span>←</span> Back to Tutor Dashboard
            </button>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
              Prepare Materials with AI
            </h1>
            <p className="text-base text-white/60 font-light">Generate customized lesson plans for your students</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-400 font-semibold mb-2">Error</div>
              <p className="text-red-300 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="mt-3 text-red-400 hover:text-red-300 text-sm underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Material Form or Generated Content */}
          {!generatedMaterial ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              {tutorLanguages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60 mb-4">
                    You haven&apos;t registered any languages yet. Please register at least one language to generate
                    materials.
                  </p>
                  <button
                    onClick={() => router.push("/tutor")}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all"
                  >
                    Go to Tutor Dashboard
                  </button>
                </div>
              ) : (
                <MaterialForm tutorLanguages={tutorLanguages} onGenerate={handleGenerate} isLoading={isGenerating} />
              )}
            </div>
          ) : (
            <MaterialDisplay
              content={generatedMaterial.content}
              params={generatedMaterial.params}
              generatedAt={generatedMaterial.generatedAt}
              onExportPDF={handleExportPDF}
              onExportMarkdown={handleExportMarkdown}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
