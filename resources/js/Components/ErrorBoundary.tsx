import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });

        // Log to error tracking service (e.g., Sentry) in production
        if (process.env.NODE_ENV === 'production') {
            // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        // Reload the page to reset state
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#202124] px-4">
                    <div className="w-full max-w-md text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                            </div>
                        </div>

                        <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            Đã xảy ra lỗi
                        </h1>

                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại hoặc quay về trang chủ.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-left">
                                <p className="mb-2 text-sm font-semibold text-red-800 dark:text-red-300">
                                    Chi tiết lỗi (chỉ hiển thị trong development):
                                </p>
                                <pre className="max-h-40 overflow-auto text-xs text-red-700 dark:text-red-400">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button
                                onClick={this.handleReset}
                                className="gap-2"
                                variant="default"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Tải lại trang
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="gap-2"
                            >
                                <Link href="/">
                                    <Home className="h-4 w-4" />
                                    Về trang chủ
                                </Link>
                            </Button>
                        </div>

                        <p className="mt-6 text-xs text-gray-500 dark:text-gray-500">
                            Nếu lỗi vẫn tiếp tục, vui lòng liên hệ hỗ trợ.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

