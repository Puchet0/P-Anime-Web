import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { SearchPage } from '../pages/SearchPage';
import { AnimePage } from '../pages/AnimePage';
import { WatchPage } from '../pages/WatchPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { FollowingPage } from '../pages/FollowingPage';
import { HistoryPage } from '../pages/HistoryPage';
import { ProfilePage } from '../pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'anime', element: <AnimePage /> },
      { path: 'watch', element: <WatchPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'following', element: <FollowingPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);
