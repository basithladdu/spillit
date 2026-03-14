import { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { UserPlus, Trash2, Users, Search, Shield, Building2, School } from 'lucide-react';
import { toast } from 'react-toastify';
import app from '../../utils/firebase';
import { useAuth } from '../../hooks/useAuth';

const db = getFirestore(app);

// Andhra Pradesh Districts
const AP_DISTRICTS = [
  "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla",
  "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur",
  "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam",
  "Prakasam", "SPSR Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam",
  "Vizianagaram", "West Godavari", "Y.S.R."
];

export default function ToFEIUsersView() {
  const { currentUser, tofeiRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersLoadError, setUsersLoadError] = useState(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('school'); // school | dtcc | stcc
  const [district, setDistrict] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolUdise, setSchoolUdise] = useState('');

  useEffect(() => {
    setUsersLoadError(null);
    const q = query(collection(db, 'tofei_users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsersLoadError(null);
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    }, (err) => {
      console.error('ToFEI Users Listener Error:', err);
      setUsersLoadError(err?.code || 'unknown');
      setUsers([]);
    });
    return () => unsub();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (tofeiRole !== 'stcc') return toast.error('Only STCC can create users.');
    if (!email || !password || !name || !role) return toast.error("Fill required fields");
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.includes('@')) return toast.error('Invalid email.');
    const existsInProfiles = users.some(u => (u.email || '').toLowerCase() === normalizedEmail);
    if (existsInProfiles) return toast.error('A user profile with this email already exists.');
    if ((role === 'school' || role === 'dtcc') && !district) return toast.error("District required");
    if (role === 'school' && (!schoolName || !schoolUdise)) return toast.error("School details required");

    setIsSubmitting(true);
    let secondaryApp;
    let newUid = null;

    try {
      // 1. Create a secondary Firebase App instance so the current STCC admin is NOT logged out
      secondaryApp = initializeApp(app.options, 'SecondaryApp_' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create the Firebase Auth User
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
      newUid = userCred.user.uid;

      // 3. Immediately sign out of the secondary instance
      await signOut(secondaryAuth);

      // 4. Create the Firestore 'tofei_users' document
      const userData = {
        email: normalizedEmail,
        name: name.trim(),
        role,
        district: role === 'stcc' ? null : district.trim(),
        schoolName: role === 'school' ? schoolName.trim() : null,
        schoolUdise: role === 'school' ? schoolUdise.trim() : null,
        password, // Save for demo/admin reference
        createdAt: serverTimestamp(),
      };

      // Strip out nulls to keep DB clean
      Object.keys(userData).forEach(key => userData[key] === null && delete userData[key]);

      await setDoc(doc(db, 'tofei_users', newUid), userData);
      // Optimistic UI update (snapshot will also update)
      setUsers(prev => [{ uid: newUid, ...userData }, ...prev]);
      
      toast.success(`${role.toUpperCase()} account created successfully!`);
      closeModal();
    } catch (err) {
      console.error('Error creating user:', err);
      if (err?.code === 'auth/email-already-in-use') {
        toast.error('Email is already in use. Use a different email, or delete that Auth user in Firebase Console.');
      } else {
        toast.error(err?.message || 'Failed to create user');
      }
    } finally {
      setIsSubmitting(false);
      // Clean up the secondary app to prevent memory leaks or name collisions
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch(cleanupErr) {
          console.error('Cleanup secondary app err:', cleanupErr);
        }
      }
    }
  };

  const handleDeleteUser = async (uid) => {
    if (tofeiRole !== 'stcc') return toast.error('Only STCC can revoke users.');
    if (!window.confirm("Delete this user profile? (This removes portal access, but the underlying Auth account must still be manually removed via Firebase Console if desired).")) return;
    try {
      await deleteDoc(doc(db, 'tofei_users', uid));
      toast.success("User access revoked.");
    } catch {
      toast.error("Failed to revoke user.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmail(''); setPassword(''); setName(''); setRole('school'); setDistrict(''); setSchoolName(''); setSchoolUdise('');
  };

  const totalLoaded = users.length;
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.district?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tf-text-main)', margin: '0 0 0.25rem' }}>User Management</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--tf-text-muted)', margin: 0 }}>
            Provision portal access for STCC, DTCC, and Schools · <strong style={{ color: 'var(--tf-text-main)' }}>{totalLoaded}</strong> loaded
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--tf-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '0.5rem', border: '1px solid var(--tf-border)', background: 'var(--tf-surface)', color: 'var(--tf-text-main)', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#22c55e', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="tf-card" style={{ overflow: 'hidden' }}>
        {usersLoadError && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--tf-border)', color: 'var(--tf-text-muted)', fontSize: '0.75rem' }}>
            Showing fallback users (reason: {usersLoadError}). Sign in as STCC with real Firebase Auth / adjust Firestore rules to view `tofei_users`.
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--tf-bg)', borderBottom: '1px solid var(--tf-border)' }}>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase' }}>User / Role</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase' }}>Contact Info</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase' }}>Jurisdiction</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase' }}>Password</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--tf-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--tf-text-muted)', fontSize: '0.85rem' }}>
                    {totalLoaded === 0
                      ? 'No users in database yet.'
                      : `No users match “${search}”. Clear the search to see all users.`}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.uid} style={{ borderBottom: '1px solid var(--tf-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: user.role === 'stcc' ? 'rgba(168,85,247,0.1)' : user.role === 'dtcc' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {user.role === 'stcc' ? <Shield size={16} color="#a855f7" /> : user.role === 'dtcc' ? <Building2 size={16} color="#3b82f6" /> : <School size={16} color="#22c55e" />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--tf-text-main)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem',
                            background: user.role === 'stcc' ? '#a855f7' : user.role === 'dtcc' ? '#3b82f6' : '#22c55e', color: '#fff', textTransform: 'uppercase'
                          }}>
                            {user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--tf-text-muted)', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--tf-text-main)' }}>{user.email}</div>
                      <div style={{ fontSize: '0.65rem' }}>UID: {user.uid?.slice(0, 8)}...</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--tf-text-main)', fontWeight: 600 }}>
                        {user.role === 'stcc' ? 'Andhra Pradesh (All)' : user.district}
                      </div>
                      {user.role === 'school' && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--tf-text-muted)', marginTop: '0.2rem' }}>
                          {user.schoolName} (UDISE: {user.schoolUdise})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--tf-text-muted)', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>
                      {user.password || '••••••'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteUser(user.uid)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--tf-surface)', width: '100%', maxWidth: '500px', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--tf-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--tf-text-main)' }}>Create New Portal User</h3>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Role Selection Tabs */}
              <div style={{ display: 'flex', background: 'var(--tf-bg)', padding: '4px', borderRadius: '0.5rem', border: '1px solid var(--tf-border)' }}>
                {[
                  { id: 'school', label: 'School', color: '#22c55e' },
                  { id: 'dtcc',   label: 'DTCC',   color: '#3b82f6' },
                  { id: 'stcc',   label: 'STCC',   color: '#a855f7' }
                ].map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)} style={{ flex: 1, padding: '0.5rem', border: 'none', background: role === r.id ? r.color : 'transparent', color: role === r.id ? '#fff' : 'var(--tf-text-muted)', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Account Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="user-email" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', marginBottom: '0.4rem' }}>Official Email *</label>
                  <input id="user-email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--tf-bg)', border: '1px solid var(--tf-border)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', color: 'var(--tf-text-main)', fontSize: '0.875rem' }} />
                </div>
                <div>
                  <label htmlFor="user-password" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', marginBottom: '0.4rem' }}>Password *</label>
                  <input id="user-password" name="password" type="text" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--tf-bg)', border: '1px solid var(--tf-border)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', color: 'var(--tf-text-main)', fontSize: '0.875rem' }} />
                </div>
              </div>

              <div>
                <label htmlFor="user-name" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', marginBottom: '0.4rem' }}>Officer / Point of Contact Name *</label>
                <input id="user-name" name="name" type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--tf-bg)', border: '1px solid var(--tf-border)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', color: 'var(--tf-text-main)', fontSize: '0.875rem' }} />
              </div>

              {/* Jurisdiction Fields */}
              {(role === 'school' || role === 'dtcc') && (
                <div>
                  <label htmlFor="user-district" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--tf-text-muted)', marginBottom: '0.4rem' }}>District Jurisdiction *</label>
                  <select id="user-district" name="district" required value={district} onChange={e => setDistrict(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--tf-bg)', border: '1px solid var(--tf-border)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', color: 'var(--tf-text-main)', fontSize: '0.875rem' }}>
                    <option value="">-- Select District --</option>
                    {AP_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {role === 'school' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', background: 'rgba(34,197,94,0.05)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <div>
                    <label htmlFor="user-school-name" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.4rem' }}>School Name *</label>
                    <input id="user-school-name" name="schoolName" type="text" required value={schoolName} onChange={e => setSchoolName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--tf-bg)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', color: 'var(--tf-text-main)', fontSize: '0.875rem' }} />
                  </div>
                  <div>
                    <label htmlFor="user-udise" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.4rem' }}>UDISE Code *</label>
                    <input id="user-udise" name="schoolUdise" type="text" required value={schoolUdise} onChange={e => setSchoolUdise(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--tf-bg)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', color: 'var(--tf-text-main)', fontSize: '0.875rem' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--tf-border)', background: 'transparent', color: 'var(--tf-text-main)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {isSubmitting ? 'Creating...' : <><UserPlus size={16} /> Create User Account</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
