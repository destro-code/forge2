import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  title?: string;
  description?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showStack: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showStack: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an unhandled execution error:", error, errorInfo);
  }

  public handleReset = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    });
  };

  public toggleStack = (): void => {
    this.setState((prev) => ({ showStack: !prev.showStack }));
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const title = this.props.title || "Execution Surface Error";
      const description =
        this.props.description ||
        "An unexpected error occurred while rendering this interactive component.";

      return (
        <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-slate-950 text-slate-100 rounded-lg border border-slate-800/80 shadow-2xl min-h-[160px]">
          <div className="flex flex-col items-center max-w-lg w-full text-center space-y-3">
            <div className="p-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>

            {this.state.error && (
              <div className="w-full text-left bg-slate-900 border border-slate-800 rounded-md p-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-red-400 font-medium mb-1">
                  <span className="flex items-center gap-1.5 truncate text-[11px]">
                    <Bug className="h-3.5 w-3.5 flex-shrink-0" />
                    {this.state.error.name}: {this.state.error.message}
                  </span>
                  <button
                    onClick={this.toggleStack}
                    className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-0.5 ml-2 transition-colors flex-shrink-0"
                  >
                    {this.state.showStack ? "Hide stack" : "Show stack"}
                    {this.state.showStack ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                </div>

                {this.state.showStack && (
                  <pre className="mt-2 p-2 bg-slate-950 rounded text-[10px] text-slate-400 overflow-x-auto max-h-36 leading-normal border border-slate-800">
                    {this.state.error.stack || "No stack trace available."}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={this.handleReset}
                size="sm"
                className="h-8 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Execution
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
