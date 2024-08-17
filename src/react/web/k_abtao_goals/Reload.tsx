import React from "react";
import "./styles/Reload.css";

interface ReloadProps {
  action: () => void;
  isLoading: boolean;
}

const Reload: React.FC<ReloadProps> = ({ action, isLoading }) => {
  return (
    <div>
      <span
        onClick={action}
        className={`sync-icon ${isLoading ? "rotating" : ""}`}
      />
    </div>
  );
};

export default Reload;
