"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error Boundary genérico — evita que un fallo local tumbe toda la app.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Sin logs pesados en producción
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface-highlight/50 p-6 text-center">
          <AlertCircle className="text-accent" size={32} />
          <h3 className="font-semibold text-white">
            {this.props.fallbackTitle ?? "Algo falló en este módulo"}
          </h3>
          <p className="max-w-sm text-sm text-text-muted">
            {this.props.fallbackMessage ??
              "El resto de la app sigue funcionando. Puedes reintentar."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent-hover"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
