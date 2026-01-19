'use client'

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error to console in development
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);

        // In production, you would send this to an error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="text-center p-8 max-w-md">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We encountered an unexpected error. Please try again.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                        >
                            Try Again
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                                <p className="text-sm font-sans text-red-600">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Page-level Error Boundary with navigation-aware reset
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]">
                    <div className="text-center p-8 max-w-md">
                        <div className="text-6xl mb-4">💔</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Page Error
                        </h2>
                        <p className="text-gray-600 mb-6">
                            This page encountered an error. Please refresh or go back.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

/**
 * Component-level Error Boundary for smaller sections
 */
export function SectionErrorBoundary({
    children,
    name
}: {
    children: ReactNode;
    name?: string;
}) {
    return (
        <ErrorBoundary
            fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">
                        {name ? `Error loading ${name}` : 'Error loading this section'}
                    </p>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;
