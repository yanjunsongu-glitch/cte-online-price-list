import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';

export async function quotationSessionFromRequest(req){
  const session=await validatedSystemSessionFromRequest(req);
  return session&&hasPermission(session,'quotation.view')?session:null;
}
