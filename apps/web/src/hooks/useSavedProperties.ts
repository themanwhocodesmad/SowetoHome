import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedPropertiesApi } from '../api/savedProperties.js';
import { useAuth } from '../auth/AuthContext.js';

// Fetched once and cached by react-query's query-key dedup - every PropertyCard on a
// page shares this single request instead of each checking its own saved status.
export function useSavedPropertyIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-properties', 'ids'],
    queryFn: savedPropertiesApi.listIds,
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
}

export function useToggleSavedProperty() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['saved-properties'] });
  };

  const save = useMutation({
    mutationFn: (propertyId: string) => savedPropertiesApi.save(propertyId),
    onSuccess: invalidate,
  });

  const unsave = useMutation({
    mutationFn: (propertyId: string) => savedPropertiesApi.unsave(propertyId),
    onSuccess: invalidate,
  });

  return { save, unsave };
}
