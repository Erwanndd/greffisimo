import { supabase } from '@/lib/customSupabaseClient';
import { handleSupabaseError } from './utils';

export const updateUserInDB = async (id, updates) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id);
    handleSupabaseError({ error, customMessage: 'updating user' });
    return data;
};

export const createUserInDB = (userData) => {
    throw new Error("La création d'utilisateur se fait via l'inscription Supabase Auth.");
};