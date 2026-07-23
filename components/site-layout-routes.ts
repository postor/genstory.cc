const immersiveRoutes = ["/projects/editor", "/projects/preview"];

export function isImmersiveRoute(pathname: string) {
  return immersiveRoutes.some((route) => pathname.startsWith(route));
}
