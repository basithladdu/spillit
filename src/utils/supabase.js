import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const unavailableError = new Error('The memory service is unavailable. Please try again later.');

const createUnavailableQuery = () => {
  const query = {
    select: () => query,
    insert: () => query,
    upsert: () => query,
    not: () => query,
    maybeSingle: () => Promise.resolve({ data: null, error: unavailableError }),
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
    resetPasswordForEmail: async () => ({ data: null, error: unavailableError }),
    updateUser: async () => ({ data: null, error: unavailableError }),
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
