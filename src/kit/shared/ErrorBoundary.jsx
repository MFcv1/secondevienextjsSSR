import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-900 p-6 text-center">
                    <div className="mb-6 p-4 bg-red-100 text-red-600 rounded-full">
                        <AlertTriangle size={48} />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Oups, une erreur est survenue</h1>
                    <p className="max-w-md text-stone-500 mb-8 leading-relaxed">
                        Une erreur inattendue a empêché l'affichage de cette page. Cela peut arriver lors du développement ou d'une mise à jour.
                    </p>

                    <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-sm border border-stone-200 text-left overflow-auto max-h-48 mb-8 text-xs font-mono">
                        <p className="font-bold text-red-500 mb-1">{this.state.error && this.state.error.toString()}</p>
                        <p className="text-stone-400 whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-8 py-3 bg-stone-900 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <RefreshCcw size={16} />
                        Recharger la page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
