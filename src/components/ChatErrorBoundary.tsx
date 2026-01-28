"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ChatErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[ChatErrorBoundary] Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <AlertCircle size={40} className="text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        The intelligent coach interface encountered an unexpected issue. Please refresh the page to reconnect.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Reload Interface
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
