import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MobileLogin from "./pages/MobileLogin";
import MobileDashboard from "./pages/MobileDashboard";
import MobileNewTriage from "./pages/MobileNewTriage";
import WebDashboard from "./pages/WebDashboard";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Mobile Pages */}
      <Route path="/mobile/login" component={MobileLogin} />
      <Route path="/mobile/dashboard" component={MobileDashboard} />
      <Route path="/mobile/triage" component={MobileNewTriage} />
      {/* Web Pages */}
      <Route path="/web/dashboard" component={WebDashboard} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
