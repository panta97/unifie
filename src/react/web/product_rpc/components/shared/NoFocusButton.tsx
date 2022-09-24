interface NoFocusButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const NoFocusButton = ({
  onClick,
  className,
  children,
}: NoFocusButtonProps) => {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (onClick) onClick();
        e.currentTarget.blur();
      }}
    >
      {children}
    </button>
  );
};
