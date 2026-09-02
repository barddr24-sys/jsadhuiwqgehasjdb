import HomeScreen from '@/app/components/home/HomeScreen';
import { xsmbAPIService } from '@/app/lib/services/xsmb-api.service';

/**
 * Home page — renders the XSMB Home Screen.
 * Server Component: Pre-fetches already-available MongoDB lottery data
 * and passes it directly to HomeScreen for instant first paint.
 */
export default async function HomePage() {
  let initialData = null;
  try {
    initialData = await xsmbAPIService.getInitialHomeData();
  } catch (err) {
    console.warn('[HomePage] Server initial data fetch error:', err);
  }

  return <HomeScreen initialData={initialData} />;
}
