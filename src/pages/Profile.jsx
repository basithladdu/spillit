import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { User, AtSign, Mail, Save, AlertCircle, CheckCircle2, Camera } from 'lucide-react';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (data) {
          setProfile({
            username: data.username || '',
            full_name: data.full_name || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username.toLowerCase(),
          full_name: profile.full_name,
          bio: profile.bio,
          updated_at: new Date()
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="heading-font text-4xl md:text-5xl font-black text-foreground mb-2">My Profile</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">How the map sees you</p>
        </header>

        <div className="bg-white border-2 border-foreground rounded-[40px] shadow-pop overflow-hidden">
          {/* Cover Placeholder */}
          <div className="h-32 bg-accent/20 border-b-2 border-foreground relative">
            <div className="absolute -bottom-12 left-10">
              <div className="w-24 h-24 rounded-3xl bg-white border-2 border-foreground shadow-pop flex items-center justify-center relative group">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-[22px]" />
                ) : (
                  <User size={40} className="text-slate-300" />
                )}
                <button className="absolute inset-0 bg-black/40 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-10 pt-16 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Username */}
              <div className="space-y-2">
                <label className="heading-font text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                  <AtSign size={14} className="text-accent" /> Username
                </label>
                <input
                  type="text"
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
                <label className="heading-font text-xs font-black uppercase tracking-[0.2em] text-foreground">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full bg-muted border-2 border-foreground rounded-2xl px-5 py-4 text-foreground font-bold outline-none focus:border-accent focus:shadow-focus transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="heading-font text-xs font-black uppercase tracking-[0.2em] text-foreground">
                Bio
              </label>
              <textarea
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
                <Mail size={14} /> Registered Email
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
                className="w-full py-4 bg-accent text-white border-2 border-foreground rounded-full font-black heading-font uppercase tracking-[0.2em] shadow-pop hover:shadow-pop-hover hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                {updating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} strokeWidth={3} />
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
