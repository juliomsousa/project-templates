// Query key factory: one entry per domain, hierarchical so a domain can be invalidated at once
// (queryClient.invalidateQueries({queryKey: queryKeys.user.all})).
const USER = ['user'] as const

export const queryKeys = {
  user: {
    all: USER,
    me: () => [...USER, 'me'] as const,
    notes: (userId: string, page = 1) =>
      [...USER, userId, 'notes', {page}] as const
  }
}
