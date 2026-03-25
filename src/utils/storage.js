import { supabase } from '../lib/supabase';

// ─── Voter fingerprint (persisted per browser) ───────────────
const getVoterId = () => {
  let id = localStorage.getItem('voter_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('voter_id', id);
  }
  return id;
};

// ─── Awards (Categories) ─────────────────────────────────────

export const getAwards = async () => {
  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data;
};

export const getAwardById = async (id) => {
  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const addAward = async (name, description) => {
  const { data, error } = await supabase
    .from('awards')
    .insert({ name, description: description || '' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAward = async (id, updates) => {
  const { data, error } = await supabase
    .from('awards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAward = async (id) => {
  const { error } = await supabase
    .from('awards')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ─── Nominees ─────────────────────────────────────────────────

export const getNominees = async (awardId) => {
  let query = supabase.from('nominees').select('*');

  if (awardId) {
    query = query.eq('award_id', awardId);
  }

  query = query.order('created_at', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  // Map snake_case DB fields to camelCase for the UI
  return data.map(n => ({
    ...n,
    awardId: n.award_id,
    imageUrl: n.image_url,
  }));
};

export const addNominee = async (awardId, name, imageUrl) => {
  const { data, error } = await supabase
    .from('nominees')
    .insert({ award_id: awardId, name, image_url: imageUrl || '' })
    .select()
    .single();
  if (error) throw error;
  return { ...data, awardId: data.award_id, imageUrl: data.image_url };
};

export const updateNominee = async (id, updates) => {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;

  const { data, error } = await supabase
    .from('nominees')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { ...data, awardId: data.award_id, imageUrl: data.image_url };
};

export const deleteNominee = async (id) => {
  const { error } = await supabase
    .from('nominees')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ─── Image Upload ─────────────────────────────────────────────

export const uploadNomineeImage = async (file) => {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `nominees/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('nominee-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('nominee-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// ─── Voting ───────────────────────────────────────────────────

export const voteForNominee = async (nomineeId, awardId) => {
  const voterId = getVoterId();

  const { error } = await supabase.rpc('cast_vote', {
    p_award_id: awardId,
    p_nominee_id: nomineeId,
    p_voter_id: voterId,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already voted for this award category.');
    }
    throw error;
  }
  return true;
};

export const hasVoted = async (awardId) => {
  const voterId = getVoterId();
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('award_id', awardId)
    .eq('voter_id', voterId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
};

// ─── Auth ─────────────────────────────────────────────────────

export const adminLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const adminLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const isAdminLoggedIn = async () => {
  const user = await getCurrentUser();
  return !!user;
};

export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user || null);
    }
  );
  return subscription;
};

// ─── Votes Overview (Admin) ──────────────────────────────────

export const getVotesOverview = async () => {
  const { data, error } = await supabase
    .from('votes')
    .select('id, created_at, voter_id, award_id, nominee_id, nominees(name), awards(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map(v => ({
    id: v.id,
    voterIdShort: v.voter_id ? v.voter_id.slice(0, 8) : '—',
    nomineeName: v.nominees?.name || 'Unknown',
    awardName: v.awards?.name || 'Unknown',
    createdAt: v.created_at,
  }));
};

export const getVotesSummary = async () => {
  // Get all nominees with their vote counts grouped by award
  const [awards, nominees] = await Promise.all([
    getAwards(),
    getNominees(),
  ]);

  return awards.map(award => ({
    ...award,
    nominees: nominees
      .filter(n => n.awardId === award.id)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0)),
    totalVotes: nominees
      .filter(n => n.awardId === award.id)
      .reduce((sum, n) => sum + (n.votes || 0), 0),
  }));
};

// ─── Realtime subscriptions ──────────────────────────────────

export const subscribeToAwards = (callback) => {
  const channel = supabase
    .channel('awards-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'awards' },
      () => callback()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

export const subscribeToNominees = (awardId, callback) => {
  const filter = awardId ? `award_id=eq.${awardId}` : undefined;
  const channelName = awardId ? `nominees-realtime-${awardId}` : 'nominees-realtime-all';

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'nominees',
        ...(filter ? { filter } : {}),
      },
      () => callback()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};
