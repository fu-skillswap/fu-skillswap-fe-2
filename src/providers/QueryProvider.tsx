/**
 * @file QueryProvider.tsx
 * @description React Context Provider cho TanStack React Query.
 * Khởi tạo và cung cấp `QueryClient` singleton cho ứng dụng phía Client.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Provider bọc ứng dụng để sử dụng các tính năng caching và data-fetching của React Query.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
