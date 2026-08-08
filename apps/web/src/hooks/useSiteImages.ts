import { useQuery } from '@tanstack/react-query';
import { siteContentApi } from '../api/siteContent.js';

// Site-wide images (currently just the logo) live outside the homepage-only content
// query so components rendered on every page - like the navbar - don't need to load
// the whole homepage payload just to know whether a custom logo has been uploaded.
export function useSiteImages() {
  return useQuery({
    queryKey: ['site-content', 'images'],
    queryFn: siteContentApi.getImages,
    staleTime: 5 * 60 * 1000,
  });
}
