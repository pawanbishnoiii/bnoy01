/**
 * Small compatibility layer so the original screens can keep their familiar
 * Link / useNavigate / useParams API while running on TanStack Router.
 */
import * as React from "react";
import {
  Link as TLink,
  useNavigate as useTNavigate,
  useParams as useTParams,
  useRouterState,
  useRouter,
} from "@tanstack/react-router";

type To = string | { pathname?: string; search?: string; hash?: string };
const toHref = (to: To) =>
  typeof to === "string" ? to : `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
  replace?: boolean;
  state?: unknown;
  children?: React.ReactNode;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state: _state, ...rest },
  ref,
) {
  const href = toHref(to);
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return <a ref={ref} href={href} {...rest} />;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TLink ref={ref} to={href as any} replace={replace} {...(rest as any)} />;
});

type NavLinkProps = Omit<LinkProps, "className"> & {
  className?: string | ((s: { isActive: boolean; isPending: boolean }) => string);
  end?: boolean;
};
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { className, end, to, ...rest },
  ref,
) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const href = toHref(to);
  const isActive = end ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const cls = typeof className === "function" ? className({ isActive, isPending: false }) : className;
  return <Link ref={ref} to={to} className={cls} {...rest} />;
});
export type { NavLinkProps };

export function useNavigate() {
  const navigate = useTNavigate();
  const router = useRouter();
  return React.useCallback(
    (to: To | number, opts?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === "number") {
        if (to < 0) router.history.back();
        else router.history.forward();
        return;
      }
      const href = toHref(to);
      if (/^https?:/.test(href)) {
        window.location.href = href;
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ href, replace: opts?.replace } as any);
    },
    [navigate, router],
  );
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useTParams({ strict: false }) as unknown as T;
}

export function useLocation() {
  const loc = useRouterState({ select: (s) => s.location });
  return {
    pathname: loc.pathname,
    search: loc.searchStr ?? "",
    hash: loc.hash ? `#${loc.hash}` : "",
    state: (loc.state ?? null) as unknown,
    key: loc.href,
  };
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string> | ((p: URLSearchParams) => URLSearchParams), opts?: { replace?: boolean }) => void,
] {
  const loc = useRouterState({ select: (s) => s.location });
  const navigate = useTNavigate();
  const params = React.useMemo(() => new URLSearchParams(loc.searchStr ?? ""), [loc.searchStr]);
  const set = React.useCallback(
    (next: URLSearchParams | Record<string, string> | ((p: URLSearchParams) => URLSearchParams), opts?: { replace?: boolean }) => {
      const value = typeof next === "function" ? next(new URLSearchParams(params)) : next;
      const sp = value instanceof URLSearchParams ? value : new URLSearchParams(value);
      const qs = sp.toString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ href: `${loc.pathname}${qs ? `?${qs}` : ""}`, replace: opts?.replace ?? true } as any);
    },
    [navigate, params, loc.pathname],
  );
  return [params, set];
}

export function Navigate({ to, replace }: { to: To; replace?: boolean }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
