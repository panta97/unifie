import React from "react";

interface WrapperProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const Wrapper = ({ children, className, onClick }: WrapperProps) => {
  return (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {children}
    </svg>
  );
};

interface PathProps {
  className?: string;
  onClick?: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const PencilAlt = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </Wrapper>
  );
};
const Duplicate = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </Wrapper>
  );
};
const Trash = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </Wrapper>
  );
};

const ExternalLink = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </Wrapper>
  );
};

const Calendar = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </Wrapper>
  );
};

const ChevronLeft = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 19l-7-7 7-7"
      />
    </Wrapper>
  );
};

const ChevronRight = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5l7 7-7 7"
      />
    </Wrapper>
  );
};

const Menu = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </Wrapper>
  );
};

const MenuAlt2 = ({ className, onClick }: PathProps) => {
  return (
    <Wrapper className={className} onClick={onClick}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 8h16M4 16h16"
      />
    </Wrapper>
  );
};

export const Svg = {
  PencilAlt,
  Duplicate,
  Trash,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Menu,
  MenuAlt2,
};
