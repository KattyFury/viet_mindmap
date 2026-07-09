import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(props: IconProps) {
  const { size = 20, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

/** Circular user avatar outline */
export function IconAccount(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c0-3.2 3-5.5 7-5.5s7 2.3 7 5.5" />
    </svg>
  );
}

/** Trash can — custom vector */
export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M7 7l.8 12.2A1.5 1.5 0 0 0 9.3 20.5h5.4a1.5 1.5 0 0 0 1.5-1.3L17 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </svg>
  );
}

/** Plus — create new / add branch */
export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Download arrow into tray */
export function IconDownload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4v11" />
      <path d="M7.5 11.5 12 16l4.5-4.5" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

/** Small mindmap mark (optional brand) */
export function IconMindmap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="8.5" y="3.5" width="7" height="5" rx="1" />
      <rect x="2.5" y="15.5" width="7" height="5" rx="1" />
      <rect x="14.5" y="15.5" width="7" height="5" rx="1" />
      <path d="M12 8.5v3.5M12 12H6v3.5M12 12h6v3.5" />
    </svg>
  );
}

/** Google mark for sign-in button (simple G shape via paths) */
export function IconGoogle(props: IconProps) {
  const { size = 18, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
