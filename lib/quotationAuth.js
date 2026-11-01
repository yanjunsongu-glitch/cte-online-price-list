import {hasPermission,systemSessionFromRequest} from '@/lib/systemAuth';

export function quotationSessionFromRequest(req){
  const session=systemSessionFromRequest(req);
  return session&&hasPermission(session,'quotation.view')?session:null;
}
