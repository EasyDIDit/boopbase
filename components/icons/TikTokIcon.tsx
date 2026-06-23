import { SVGProps } from 'react';

export const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12.5 3.5v12.5a3 3 0 1 1-3-3" />
    <path d="M19 8.5a7 7 0 0 1-7 7" />
    <path d="M9 17.5a3 3 0 1 1-3-3" />
  </svg>
);