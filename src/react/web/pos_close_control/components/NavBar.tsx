import React from "react";
import { NavLink } from "react-router-dom";

const NavBar = () => {
  const getLinkStyles = (isActive: boolean) => {
    let styles = "px-2 py-1";
    if (isActive) {
      styles += " bg-black/5";
    }
    return styles;
  };
  const basePath = "/apps/pos-close-control";

  return (
    <>
      <nav className="border-b border-black">
        <NavLink
          className={({ isActive }) => getLinkStyles(isActive)}
          to={basePath}
        >
          RESUMEN
        </NavLink>
        <NavLink
          className={({ isActive }) => getLinkStyles(isActive)}
          to={`${basePath}/cash`}
        >
          EFECTIVO
        </NavLink>
        <NavLink
          className={({ isActive }) => getLinkStyles(isActive)}
          to={`${basePath}/card`}
        >
          TARJETA
        </NavLink>
        <NavLink
          className={({ isActive }) => getLinkStyles(isActive)}
          to={`${basePath}/balance-start`}
        >
          INICIO
        </NavLink>
        <NavLink
          className={({ isActive }) => getLinkStyles(isActive)}
          to={`${basePath}/discount`}
        >
          DESC
        </NavLink>
        <NavLink
          className={({ isActive }) => getLinkStyles(isActive)}
          to={`${basePath}/cash-unlocked`}
        >
          RECUENTO
        </NavLink>
      </nav>
    </>
  );
};

export default NavBar;
