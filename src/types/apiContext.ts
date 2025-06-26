export interface ApiHandlerContext<TUser = any, TReq = any, TContext = any> {
  user: TUser;
  req: TReq;
  context: TContext;
}