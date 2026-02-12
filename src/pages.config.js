/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Achievements from './pages/Achievements';
import AdminContentManager from './pages/AdminContentManager';
import AdminImagePopulator from './pages/AdminImagePopulator';
import ChallengeLeaderboard from './pages/ChallengeLeaderboard';
import Discover from './pages/Discover';
import Leaderboard from './pages/Leaderboard';
import Onboarding from './pages/Onboarding';
import Referrals from './pages/Referrals';
import SideGames from './pages/SideGames';
import StreakLeaderboard from './pages/StreakLeaderboard';
import Upload from './pages/Upload';
import UserLeaderboard from './pages/UserLeaderboard';
import UsernameSetup from './pages/UsernameSetup';
import Profile from './pages/Profile';
import AITools from './pages/AITools';
import Home from './pages/Home';
import Community from './pages/Community';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "AdminContentManager": AdminContentManager,
    "AdminImagePopulator": AdminImagePopulator,
    "ChallengeLeaderboard": ChallengeLeaderboard,
    "Discover": Discover,
    "Leaderboard": Leaderboard,
    "Onboarding": Onboarding,
    "Referrals": Referrals,
    "SideGames": SideGames,
    "StreakLeaderboard": StreakLeaderboard,
    "Upload": Upload,
    "UserLeaderboard": UserLeaderboard,
    "UsernameSetup": UsernameSetup,
    "Profile": Profile,
    "AITools": AITools,
    "Home": Home,
    "Community": Community,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};