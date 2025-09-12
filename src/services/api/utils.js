import { supabase } from '@/lib/customSupabaseClient';

export const handleSupabaseError = ({ error, customMessage }) => {
  if (error) {
    console.error(`Supabase error in ${customMessage}:`, error);
    throw new Error(`${customMessage}. ${error.message}`);
  }
};

export const slugify = (str) => {
  if (!str) return '';
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrssssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return str.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
};

export const getProfileById = async (id) => {
  if (!id) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  handleSupabaseError({ error, customMessage: 'fetching profile' });
  return data;
};

export const getProfileByEmail = async (email) => {
  if (!email) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
  handleSupabaseError({ error, customMessage: 'fetching profile by email' });
  return data;
};

// Build unique participant emails for a formality (formalist + clients).
export const getParticipantEmails = (formality, excludeUserId = null) => {
  if (!formality) return [];
  const emails = [];
  if (formality.formalist?.email && formality.formalist?.id !== excludeUserId) {
    emails.push(formality.formalist.email);
  }
  const clientEmails = (formality.clients || [])
    .filter(c => c && c.email && c.id !== excludeUserId)
    .map(c => c.email);
  return Array.from(new Set([...emails, ...clientEmails]));
};
