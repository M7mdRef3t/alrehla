import type { FC } from "react";

interface GoogleMarkProps {
  className?: string;
  title?: string;
}

// Minimal inline Google "G" mark (multi-color). No external assets.
export const GoogleMark: FC<GoogleMarkProps> = ({ className, title = "Google" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={title}
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.29h6.48a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.58-5.17 3.58-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.19 7.19 0 0 1 4.9 12c0-.8.14-1.58.37-2.29V6.62H1.26A12 12 0 0 0 0 12c0 1.93.46 3.75 1.26 5.38l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.6 4.58 1.78l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.62l4.01 3.09C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
};

