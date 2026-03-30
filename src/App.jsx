import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ErrorBoundary';
import DifficultyRanking from './pages/DifficultyRanking';
import Marketplace from './pages/Marketplace';
import Collection from './pages/Collection';
import Wallet from './pages/Wallet';
import Trades from './pages/Trades';
import TournamentHub from './pages/TournamentHub';
import TournamentBracket from './pages/TournamentBracket';
import CollectionAnalytics from './pages/CollectionAnalytics';
import AdminAnalytics from './pages/AdminAnalytics';
import RewardHistory from './pages/RewardHistory';
import SocialFeed from './pages/SocialFeed';
import DailyRewards from './pages/DailyRewards';
import BlitzMode from './pages/BlitzMode';
import CheckOutMyAI from './pages/CheckOutMyAI';
import AdminDashboard from './pages/AdminDashboard';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/DifficultyRanking" element={<LayoutWrapper currentPageName="DifficultyRanking"><DifficultyRanking /></LayoutWrapper>} />
      <Route path="/Marketplace" element={<LayoutWrapper currentPageName="Marketplace"><Marketplace /></LayoutWrapper>} />
      <Route path="/Collection" element={<LayoutWrapper currentPageName="Collection"><Collection /></LayoutWrapper>} />
      <Route path="/Wallet" element={<LayoutWrapper currentPageName="Wallet"><Wallet /></LayoutWrapper>} />
      <Route path="/Trades" element={<LayoutWrapper currentPageName="Trades"><Trades /></LayoutWrapper>} />
      <Route path="/TournamentHub" element={<LayoutWrapper currentPageName="TournamentHub"><TournamentHub /></LayoutWrapper>} />
      <Route path="/TournamentBracket/:id" element={<LayoutWrapper currentPageName="TournamentBracket"><TournamentBracket /></LayoutWrapper>} />
      <Route path="/CollectionAnalytics" element={<LayoutWrapper currentPageName="CollectionAnalytics"><CollectionAnalytics /></LayoutWrapper>} />
      <Route path="/AdminAnalytics" element={<LayoutWrapper currentPageName="AdminAnalytics"><AdminAnalytics /></LayoutWrapper>} />
      <Route path="/RewardHistory" element={<LayoutWrapper currentPageName="RewardHistory"><RewardHistory /></LayoutWrapper>} />
      <Route path="/SocialFeed" element={<LayoutWrapper currentPageName="SocialFeed"><SocialFeed /></LayoutWrapper>} />
      <Route path="/DailyRewards" element={<LayoutWrapper currentPageName="DailyRewards"><DailyRewards /></LayoutWrapper>} />
      <Route path="/BlitzMode" element={<LayoutWrapper currentPageName="BlitzMode"><BlitzMode /></LayoutWrapper>} />
      <Route path="/CheckOutMyAI" element={<LayoutWrapper currentPageName="CheckOutMyAI"><CheckOutMyAI /></LayoutWrapper>} />
      <Route path="/VideoVoting" element={<LayoutWrapper currentPageName="VideoVoting"><VideoVoting /></LayoutWrapper>} />
      <Route path="/admin" element={<LayoutWrapper currentPageName="admin"><AdminDashboard /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App