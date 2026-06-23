import { SVGProps } from 'react';

export const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
    <circle cx="12" cy="12" r="4"></circle>
    <circle cx="17" cy="7" r="1.5"></circle>
  </svg>
);