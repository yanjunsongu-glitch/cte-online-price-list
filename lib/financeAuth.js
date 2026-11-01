import {hasPermission,systemSessionFromRequest} from '@/lib/systemAuth';

export function financeSessionFromRequest(req){
  const session=systemSessionFromRequest(req);
  return session&&hasPermission(session,'finance.view')?session:null;
}
