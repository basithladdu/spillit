import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { User, AtSign, Mail, Save, Camera, Map, Ghost } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { PageSpinner } from '../components/UI/PageStatus';

function Profile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  const [memoryStats, setMemoryStats] = useState({ count: 0, upvotes: 0 });

  useEffect(() => {
    let active = true;
    if (!currentUser) {
      setLoading(false);
      return () => { active = false; };
    }

    const fetchProfile = async () => {
      try {
        const [{ data, error: profileError }, { data: memories }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
          supabase.from('memories').select('upvotes').eq('user_id', currentUser.id),
        ]);

        if (active) {
          if (data) {
            setProfile({
              username: data.username || '',
              full_name: data.full_name || '',
              bio: data.bio || '',
              avatar_url: data.avatar_url || ''
            });
          } else if (!profileError || profileError.code === 'PGRST116') {
            const defaultUsername = (currentUser.email?.split('@')[0] || `spiller_${currentUser.id.slice(0, 6)}`)
              .replace(/[^a-z0-9_]/gi, '')
              .slice(0, 20) || `spiller_${currentUser.id.slice(0, 6)}`;
            const { data: created } = await supabase
              .from('profiles')
              .insert({ id: currentUser.id, username: defaultUsername.toLowerCase() })
              .select()
              .single();
            if (created) {
              setProfile({
                username: created.username || defaultUsername,
                full_name: '',
                bio: '',
                avatar_url: ''
              });
            }
          }
        }
        if (memories && active) {
          setMemoryStats({
            count: memories.length,
            upvotes: memories.reduce((sum, m) => sum + (m.upvotes || 0), 0),
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();
    return () => { active = false; };
  }, [currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          username: profile.username.toLowerCase(),
          full_name: profile.full_name,
          bio: profile.bio,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageSpinner label="Loading profile" />;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="heading-font text-4xl md:text-5xl font-black text-foreground mb-2">My Profile</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">How the map sees you</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-2xl border-2 border-foreground bg-white px-5 py-3 shadow-pop">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Memories spilled</p>
              <p className="heading-font text-2xl font-black text-accent">{memoryStats.count}</p>
            </div>
            <div className="rounded-2xl border-2 border-foreground bg-white px-5 py-3 shadow-pop">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hearts received</p>
              <p className="heading-font text-2xl font-black text-secondary">{memoryStats.upvotes}</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-foreground bg-accent px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-pop hover:-translate-y-0.5 transition-transform self-end"
            >
              <Map size={14} strokeWidth={2.5} aria-hidden /> Spill on map
            </Link>
          </div>
        </header>

        {memoryStats.count === 0 && (
          <div className="mb-8 rounded-2xl border-2 border-dashed border-foreground bg-muted/40 p-8 text-center">
            <Ghost size={40} className="mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="heading-font text-xl font-bold text-foreground mb-2">No memories spilled yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Drop your first pin on the map — it will show up in your stats here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-accent px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-pop hover:-translate-y-0.5 transition-transform"
            >
              <Map size={14} strokeWidth={2.5} aria-hidden="true" /> Spill your first memory
            </Link>
          </div>
        )}

        <div className="bg-white border-2 border-foreground rounded-[40px] shadow-pop overflow-hidden">
          {/* Cover Placeholder */}
          <div className="h-32 bg-accent/20 border-b-2 border-foreground relative">
            <div className="absolute -bottom-12 left-10">
              <div className="w-24 h-24 rounded-3xl bg-white border-2 border-foreground shadow-pop flex items-center justify-center relative group">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} width="96" height="96" alt="Profile avatar" className="w-full h-full object-cover rounded-[22px]" />
                ) : (
                  <User size={40} className="text-slate-300" />
                )}
                <button type="button" aria-label="Change avatar (coming soon)" disabled className="absolute inset-0 flex items-center justify-center rounded-[22px] bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={20} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-10 pt-16 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="profile-username" className="heading-font text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                  <AtSign size={14} className="text-accent" aria-hidden /> Username
                </label>
                <input
                  id="profile-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder="cool_spiller"
                  className="w-full bg-muted border-2 border-foreground rounded-2xl px-5 py-4 text-foreground font-bold outline-none focus:border-accent focus:shadow-focus transition-all"
                  required
                  minLength={3}
                />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="profile-display-name" className="heading-font text-xs font-black uppercase tracking-[0.2em] text-foreground">
                  Display Name
                </label>
                <input
                  id="profile-display-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full bg-muted border-2 border-foreground rounded-2xl px-5 py-4 text-foreground font-bold outline-none focus:border-accent focus:shadow-focus transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label htmlFor="profile-bio" className="heading-font text-xs font-black uppercase tracking-[0.2em] text-foreground">
                Bio
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Spilling secrets since..."
                rows={4}
                className="w-full bg-muted border-2 border-foreground rounded-2xl px-5 py-4 text-foreground font-bold outline-none focus:border-accent focus:shadow-focus transition-all resize-none"
              />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2 opacity-60">
              <label className="heading-font text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
              <Mail size={14} aria-hidden="true" /> Registered Email
              </label>
              <div className="w-full bg-white border-2 border-foreground rounded-2xl px-5 py-4 text-foreground font-bold italic">
                {currentUser?.email}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase pl-2">Email cannot be changed</p>
            </div>

            {/* Action */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={updating}
                aria-busy={updating}
                aria-label={updating ? 'Saving profile' : undefined}
                className="w-full py-4 bg-accent text-white border-2 border-foreground rounded-full font-black heading-font uppercase tracking-[0.2em] shadow-pop hover:shadow-pop-hover hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                {updating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <Save size={20} strokeWidth={3} aria-hidden="true" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
