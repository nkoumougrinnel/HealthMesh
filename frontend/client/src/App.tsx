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
import TabletFrame from "./components/TabletFrame";
import TabletRedirect from "./pages/TabletRedirect";
import { TABLET } from "@/lib/routes";

const TabletPage = (Page: React.ComponentType) => () => (
  <TabletFrame>
    <Page />
  </TabletFrame>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Application terrain — tablette */}
      <Route path={TABLET.login} component={TabletPage(MobileLogin)} />
      <Route path={TABLET.dashboard} component={TabletPage(MobileDashboard)} />
      <Route path={TABLET.triage} component={TabletPage(MobileNewTriage)} />
      {/* Anciennes URLs mobile → tablette */}
      <Route path="/mobile/login" component={TabletRedirect} />
      <Route path="/mobile/dashboard" component={TabletRedirect} />
      <Route path="/mobile/triage" component={TabletRedirect} />
      <Route path="/web/dashboard" component={WebDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
