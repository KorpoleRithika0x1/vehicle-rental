import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-sand px-4">
          <div className="max-w-lg rounded-[2rem] bg-white p-10 text-center shadow-soft">
            <h1 className="font-heading text-4xl text-ink">Something slipped off track.</h1>
            <p className="mt-4 text-slate-600">The app hit an unexpected error. Refresh the page or head back home.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
              Back to home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
