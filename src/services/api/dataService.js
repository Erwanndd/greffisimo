import { supabase } from '@/lib/customSupabaseClient';
import { handleSupabaseError } from './utils';

export const fetchAllData = async (user) => {
    let formalityQuery = supabase.from('formalities').select(`
        *,
        formalist:profiles!formalist_id(*),
        clients:formality_clients!formality_id(profile:profiles!client_id(*)),
        creator:profiles!created_by(*),
        tribunal:tribunals(*),
        tariff:tariffs(*)
    `).order('created_at', { ascending: false });

    let relevantFormalityIds = [];

    if (user.role === 'formalist') {
        formalityQuery = formalityQuery.eq('formalist_id', user.id);
    } else if (user.role === 'client') {
        const { data: clientFormalities, error: clientFormalitiesError } = await supabase
            .from('formality_clients')
            .select('formality_id')
            .eq('client_id', user.id);
        handleSupabaseError({ error: clientFormalitiesError, customMessage: 'fetching client formalities' });
        const formalityIds = clientFormalities.map(cf => cf.formality_id);
        formalityQuery = formalityQuery.in('id', formalityIds);
    }

    const { data: formalities, error: formalitiesError } = await formalityQuery;
    handleSupabaseError({ error: formalitiesError, customMessage: 'fetching formalities' });

    relevantFormalityIds = formalities.map(f => f.id);

    const transformedFormalities = formalities.map(f => ({
        ...f,
        clients: f.clients.map(c => c.profile)
    }));
    
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
    handleSupabaseError({ error: profilesError, customMessage: 'fetching profiles' });
    
    let historyQuery = supabase.from('history').select(`
      *,
      author:profiles(*)
    `).order('timestamp', { ascending: false });
    historyQuery = historyQuery.in('formality_id', relevantFormalityIds);
    
    const { data: history, error: historyError } = await historyQuery;
    handleSupabaseError({ error: historyError, customMessage: 'fetching history' });

    return { formalities: transformedFormalities, users: profiles, history };
};

export const fetchTribunals = async () => {
    const { data, error } = await supabase.from('tribunals').select('*');
    handleSupabaseError({ error, customMessage: 'fetching tribunals' });
    return data;
};

export const fetchTariffs = async () => {
    const { data, error } = await supabase.from('tariffs').select('*');
    handleSupabaseError({ error, customMessage: 'fetching tariffs' });
    return data;
};
