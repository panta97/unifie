import { Fragment, ReactNode } from "react";
import { useSelector } from "react-redux";
import { selectIsLocked } from "../../app/slice/security/securitySlice";
import { Login } from "./Login";

interface LockProps {
  children: ReactNode;
}

export const LockWrapper = ({ children }: LockProps) => {
  const isLocked = useSelector(selectIsLocked);
  if (isLocked) return <Login />;
  return <Fragment>{children}</Fragment>;
};
