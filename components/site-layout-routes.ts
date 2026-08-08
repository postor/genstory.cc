import { pathnameWithoutPublicLang } from "@/lib/seo";

const immersiveRoutes = ["/projects/editor", "/projects/preview"];
const homeRoutes = ["/", "/zh", "/en"];

export function isImmersiveRoute(pathname: string) {
  const unlocalizedPathname = pathnameWithoutPublicLang(pathname);
  return immersiveRoutes.some((route) => unlocalizedPathname.startsWith(route));
}

export function isHomeRoute(pathname: string) {
  return homeRoutes.includes(pathname);
}

export function shouldShowSiteContentBackground(pathname: string) {
  return !isHomeRoute(pathname) && !isImmersiveRoute(pathname);
}
