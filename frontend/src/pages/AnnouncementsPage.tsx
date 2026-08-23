import { FC } from 'react';
import ErrorBoundary from '../components/ErrorBoundary.tsx';

// A minimal placeholder for the Announcements page.
// It currently renders a simple message. Replace with real UI later.
const AnnouncementsPage: FC = () => {
  return (
    <ErrorBoundary fallback={<div>Something went wrong.</div>}>
      <div className="p-4">Announcements page – content coming soon.</div>
    </ErrorBoundary>
  );
};

export default AnnouncementsPage;
