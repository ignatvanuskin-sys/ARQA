import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "#f4f0e8", color: "#151515" }}>
          <div style={{ width: "100%", maxWidth: 640 }}>
            <AlertTriangle size={48} style={{ color: "#7c2732", marginBottom: 24 }} />
            <h2 style={{ margin: "0 0 16px", fontFamily: "'Manrope', sans-serif" }}>Что-то пошло не так.</h2>
            <pre style={{ margin: "0 0 24px", padding: 16, background: "#fbf9f5", border: "1px solid #d9d2c7", overflow: "auto", fontSize: 12, whiteSpace: "break-spaces" }}>
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "#f4c400", color: "#151515", border: 0, fontWeight: 800, fontFamily: "'Manrope', sans-serif", cursor: "pointer" }}
            >
              <RotateCcw size={16} /> Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
