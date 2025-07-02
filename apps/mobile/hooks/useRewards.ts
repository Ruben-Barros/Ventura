import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

const fetchRewards = async () => {
  // In a real implementation, we would call the rewards edge function here.
  // For now, we'll just return static data.
  return {
    xp: 100,
    coins: 50,
    streak: 3,
  };
};

export const useRewards = () => {
  return useQuery({ queryKey: ['rewards'], queryFn: fetchRewards });
};

