import React from 'react';
import Link from 'next/link';

/**
 * Capture les erreurs de rendu non gerees cote client sans alourdir le bundle mobile.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erreur inattendue de rendu',
    };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
    if (process.env.NODE_ENV !== 'test') {
      console.error('[MyTicket ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-[60vh] flex items-center justify-center px-4 py-12"
        >
          <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-[#11141e] p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center text-xl font-bold border border-rose-500/30">
              !
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">
                Une erreur d&apos;affichage est survenue
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                L&apos;interface a rencontré un problème imprévu. Vous pouvez réessayer ou revenir au catalogue.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
              >
                Réessayer
              </button>
              <Link
                href="/"
                onClick={this.handleReset}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-sm border border-white/10 transition-colors"
              >
                Accueil
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
