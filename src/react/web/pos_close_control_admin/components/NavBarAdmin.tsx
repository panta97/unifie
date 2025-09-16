import { NavLink } from "react-router-dom";

const NavBarAdmin = () => {
    const getLinkStyles = (isActive: boolean) => {
        let styles = "px-2 py-1";
        if (isActive) {
            styles += " bg-black/5";
        }
        return styles;
    };
    const basePath = "/apps/pos-close-control-admin";

    return (
        <>
            <nav className="border-b border-black">
                <NavLink
                    className={({ isActive }) => getLinkStyles(isActive)}
                    to={`${basePath}/`}
                >
                    ADMIN
                </NavLink>
                <NavLink
                    className={({ isActive }) => getLinkStyles(isActive)}
                    to={`${basePath}/discount`}
                >
                    DESCUENTOS
                </NavLink>
                <a
                    className="px-2 py-1 ml-4 bg-blue-100 hover:bg-blue-200"
                    href="/apps/pos-close-control/"
                >
                    ← VOLVER
                </a>
            </nav>
        </>
    );
};

export default NavBarAdmin;