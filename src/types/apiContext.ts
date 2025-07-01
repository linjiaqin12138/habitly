export interface ApiHandlerContext<TUser = Record<string, unknown>, TReq = Record<string, unknown>, TContext = Record<string, unknown>> {
  user: TUser;
  req: TReq;
  context: TContext;
}