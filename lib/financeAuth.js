import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';

export async function financeSessionFromRequest(req){
  const session=await validatedSystemSessionFromRequest(req);
  return session&&hasPermission(session,'finance.view')?session:null;
}
