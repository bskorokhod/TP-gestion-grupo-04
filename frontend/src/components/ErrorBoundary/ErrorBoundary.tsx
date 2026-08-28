import { Component, PropsWithChildren } from "react";

export class ErrorBoundary extends Component<PropsWithChildren, { error: unknown }> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      // You can render any custom fallback UI
      return <pre>There was an error. Check the console</pre>;
    }

    return this.props.children;
  }
}
