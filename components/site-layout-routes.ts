const immersiveRoutes = ["/projects/editor", "/projects/preview"];
const homeRoutes = ["/", "/zh", "/en"];

export function isImmersiveRoute(pathname: string) {
  return immersiveRoutes.some((route) => pathname.startsWith(route));
}

export function isHomeRoute(pathname: string) {
  return homeRoutes.includes(pathname);
}

export function shouldShowSiteContentBackground(pathname: string) {
  return !isHomeRoute(pathname) && !isImmersiveRoute(pathname);
}
