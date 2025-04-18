import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { ThemeProvider } from "@/features/theme/components/ThemeProvider";
import { ClerkProvider } from "@clerk/clerk-react";
import { TrpcProvider } from "./trpc/trpc";
import { ErrorBoundary } from "@/shared";
import { LanguageProvider } from "./i18n/LanguageContext";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing Clerk publishable key");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ClerkProvider publishableKey={publishableKey}>
      <TrpcProvider>
        <Provider store={store}>
          <ThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </Provider>
      </TrpcProvider>
    </ClerkProvider>
  </ErrorBoundary>
);
