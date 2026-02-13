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
import AIBattleLeaderboard from './pages/AIBattleLeaderboard';
import AIChallenge from './pages/AIChallenge';
import AIImageGenerator from './pages/AIImageGenerator';
import AITools from './pages/AITools';
import Achievements from './pages/Achievements';
import AdminContentManager from './pages/AdminContentManager';
import AdminImagePopulator from './pages/AdminImagePopulator';
import Analytics from './pages/Analytics';
import AttributeGame from './pages/AttributeGame';
import AttributeLeaderboard from './pages/AttributeLeaderboard';
import BlitzChallengeLeaderboard from './pages/BlitzChallengeLeaderboard';
import BlitzGame from './pages/BlitzGame';
import Board from './pages/Board';
import ChallengeLeaderboard from './pages/ChallengeLeaderboard';
import Community from './pages/Community';
import CreateChallenge from './pages/CreateChallenge';
import Discover from './pages/Discover';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Referrals from './pages/Referrals';
import SideGames from './pages/SideGames';
import StreakLeaderboard from './pages/StreakLeaderboard';
import Upload from './pages/Upload';
import UserLeaderboard from './pages/UserLeaderboard';
import UsernameSetup from './pages/UsernameSetup';
import Landing from './pages/Landing';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIBattleLeaderboard": AIBattleLeaderboard,
    "AIChallenge": AIChallenge,
    "AIImageGenerator": AIImageGenerator,
    "AITools": AITools,
    "Achievements": Achievements,
    "AdminContentManager": AdminContentManager,
    "AdminImagePopulator": AdminImagePopulator,
    "Analytics": Analytics,
    "AttributeGame": AttributeGame,
    "AttributeLeaderboard": AttributeLeaderboard,
    "BlitzChallengeLeaderboard": BlitzChallengeLeaderboard,
    "BlitzGame": BlitzGame,
    "Board": Board,
    "ChallengeLeaderboard": ChallengeLeaderboard,
    "Community": Community,
    "CreateChallenge": CreateChallenge,
    "Discover": Discover,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "Referrals": Referrals,
    "SideGames": SideGames,
    "StreakLeaderboard": StreakLeaderboard,
    "Upload": Upload,
    "UserLeaderboard": UserLeaderboard,
    "UsernameSetup": UsernameSetup,
    "Landing": Landing,
}

export const pagesConfig = {
    mainPage: "AIBattleLeaderboard",
    Pages: PAGES,
    Layout: __Layout,
};