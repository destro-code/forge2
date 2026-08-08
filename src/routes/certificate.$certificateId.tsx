import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  Award,
  ArrowLeft,
  Printer,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Calendar,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/certificate/$certificateId")({
  head: () => ({
    meta: [
      { title: "Engineering Certificate · Forge" },
      {
        name: "description",
        content: "Official Certificate of Mastery and Path Completion.",
      },
      { property: "og:title", content: "Engineering Certificate · Forge" },
    ],
  }),
  component: CertificateRoute,
});

function CertificateRoute() {
  const { certificateId } = Route.useParams();
  const progress = useProgress();
  const [isExporting, setIsExporting] = useState(false);

  const cert = (progress.certificates || []).find((c) => c.id === certificateId);

  if (!cert) {
    return (
      <div className="space-y-4 py-16 text-center max-w-md mx-auto">
        <Award className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Certificate Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested certificate ID could not be located in your profile records.
        </p>
        <Button asChild variant="outline">
          <Link to="/certificates">
            <ArrowLeft className="mr-2 h-4 w-4" /> View All Certificates
          </Link>
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Client-side HTML5 Canvas rasterization
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("certificate-card");
      if (!element) throw new Error("Certificate element not found");

      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const scale = 2; // High-DPI

      const clone = element.cloneNode(true) as HTMLElement;

      // Inline computed styles to ensure they render in SVG
      const applyInlineStyles = (source: Element, target: Element) => {
        if (source instanceof HTMLElement && target instanceof HTMLElement) {
          const computed = window.getComputedStyle(source);
          // Key styles to preserve layout and look
          const styles = [
            "color",
            "background-color",
            "border-color",
            "border-width",
            "border-style",
            "border-radius",
            "font-family",
            "font-size",
            "font-weight",
            "letter-spacing",
            "text-transform",
            "line-height",
            "display",
            "flex-direction",
            "align-items",
            "justify-content",
            "padding-top",
            "padding-right",
            "padding-bottom",
            "padding-left",
            "margin-top",
            "margin-right",
            "margin-bottom",
            "margin-left",
            "gap",
            "box-sizing",
            "text-align",
            "position",
            "top",
            "left",
            "right",
            "bottom",
            "width",
            "height",
            "grid-template-columns",
            "opacity",
          ];
          for (const key of styles) {
            target.style.setProperty(key, computed.getPropertyValue(key));
          }
        }

        const sourceChildren = Array.from(source.children);
        const targetChildren = Array.from(target.children);
        for (let i = 0; i < sourceChildren.length; i++) {
          applyInlineStyles(sourceChildren[i], targetChildren[i]);
        }
      };

      applyInlineStyles(element, clone);

      // Serialize to SVG using foreignObject
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${clone.outerHTML}
            </div>
          </foreignObject>
        </svg>
      `;

      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.scale(scale, scale);

          // Draw solid background based on document color scheme
          const isDark = document.documentElement.classList.contains("dark");
          ctx.fillStyle = isDark ? "#020817" : "#ffffff";
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0);

          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Forge_Certificate_${cert.id}.png`;
          link.href = pngUrl;
          link.click();
          toast.success("Certificate downloaded successfully!");
        }
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      img.onerror = () => {
        setIsExporting(false);
        toast.error("Failed to render certificate image.");
      };

      img.src = url;
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      toast.error("Failed to export certificate.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Button asChild variant="outline" size="sm">
          <Link to="/certificates">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Certificates
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadPNG}
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PNG
          </Button>
          <Button
            onClick={() => window.print()}
            variant="default"
            size="sm"
            className="gap-2 shadow-glow"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Official Certificate Box */}
      <div className="relative print:m-0 print:p-0">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #certificate-print-zone, #certificate-print-zone * {
              visibility: visible;
            }
            #certificate-print-zone {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            @page {
              size: landscape;
              margin: 0cm;
            }
          }
        `}</style>
        <div id="certificate-print-zone">
          <Card
            id="certificate-card"
            className="relative overflow-hidden border-2 border-primary/40 bg-card p-8 sm:p-12 shadow-2xl space-y-8 print:border-black print:text-black print:bg-white print:shadow-none print:w-[1056px] print:h-[816px] print:m-auto print:mt-12"
          >
            {/* Decorative Framing Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-full border-b border-r border-primary/20 pointer-events-none print:hidden" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-tl-full border-t border-l border-primary/20 pointer-events-none print:hidden" />

            {/* Header Branding */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-6 print:border-gray-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 print:border-black">
                  <GraduationCap className="h-8 w-8 text-primary print:text-black" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary print:text-black">
                    FORGE ENGINEERING ACADEMY
                  </div>
                  <div className="text-xl font-black tracking-tight text-foreground print:text-black">
                    OFFICIAL CERTIFICATE OF MASTERY
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary print:border-black print:text-black"
              >
                <ShieldCheck className="h-4 w-4" /> VERIFIED CREDENTIAL
              </Badge>
            </div>

            {/* Main Certificate Content Body */}
            <div className="text-center space-y-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground print:text-gray-600">
                THIS CERTIFIES THAT
              </p>

              <div className="space-y-1">
                <h2 className="text-4xl sm:text-5xl font-black text-foreground print:text-black">
                  Henry Mosiali
                </h2>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground print:text-gray-600">
                  HAS SUCCESSFULLY DEMONSTRATED PROFICIENCY AND PASSED THE FINAL CUMULATIVE
                  ASSESSMENT FOR
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-gradient print:text-black">
                  {cert.pathTitle}
                </h1>
                <div className="h-1 w-24 bg-primary mx-auto rounded-full print:bg-black" />
              </div>

              <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed print:text-gray-700">
                In recognition of completing all core curriculum modules, chapter deep-dive topics,
                hands-on practice, and achieving an outstanding score on the final path examination.
              </p>
            </div>

            {/* Key Details Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border/60 text-center sm:text-left print:border-gray-300">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground print:text-gray-500">
                  Examination Score
                </span>
                <div className="text-lg font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5 print:text-black">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 print:text-black" />
                  {cert.score}% Final Score
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground print:text-gray-500">
                  Date Issued
                </span>
                <div className="text-lg font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5 print:text-black">
                  <Calendar className="h-4 w-4 text-primary print:text-black" />
                  {formattedDate}
                </div>
              </div>
              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground print:text-gray-500">
                  Certificate ID
                </span>
                <div className="font-mono text-xs text-muted-foreground break-all print:text-black">
                  {cert.id}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
