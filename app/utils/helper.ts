import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  try {
    return format(parseISO(dateString), 'dd MMM', { locale: vi });
  } catch (error) {
    console.log('Error parsing date:', dateString, error);
    toast.error('Error parsing date');
    return null;
  }
};
