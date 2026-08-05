import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const unavailableError = new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.');

const createUnavailableQuery = () => {
  const query = {
    select: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    eq: () => query,
    neq: () => query,
    order: () => query,
    limit: () => query,
    single: () => Promise.resolve({ data: null, error: unavailableError }),
    then: (resolve, reject) => Promise.resolve({ data: [], error: unavailableError }).then(resolve, reject),
  };
  return query;
};

const createUnavailableClient = () => ({
  auth: {
    signUp: async () => ({ data: null, error: unavailableError }),
    signInWithPassword: async () => ({ data: null, error: unavailableError }),
    signInWithOAuth: async () => ({ data: null, error: unavailableError }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: unavailableError }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => createUnavailableQuery(),
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  removeChannel: () => Promise.resolve({ error: null }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: unavailableError }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: async () => ({ data: null, error: unavailableError }),
    }),
  },
});

if (!supabaseConfigured) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createUnavailableClient();
