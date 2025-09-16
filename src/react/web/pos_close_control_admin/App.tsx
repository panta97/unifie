  import NavBarAdmin from "./components/NavBarAdmin";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Discount } from "./components/discount/Discount";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
    selectLockedSince,
    updateSecurity,
} from "./app/slice/security/securitySlice";
import { LOCKAFTER_TIME } from "./app/slice/security/config";
import { setFetchStatusesToIdle } from "./app/slice/pos/posSlice";

const AdminHome = () => {
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Panel de Administración</h2>
            <p>Bienvenido al panel de administración de POS.</p>
            <div className="mt-4">
                <p>Funciones disponibles:</p>
                <ul className="list-disc ml-6 mt-2">
                    <li>Gestión de descuentos</li>
                    <li>Configuraciones avanzadas</li>
                </ul>
            </div>
        </div>
    );
};

function AppAdmin() {
    const lockedSince = useAppSelector(selectLockedSince);
    const dispatch = useAppDispatch();
    const basePath = "/apps/pos-close-control-admin";

    useEffect(() => {
        dispatch(setFetchStatusesToIdle());
        const currentTime = new Date().getTime();
        if (currentTime - lockedSince > LOCKAFTER_TIME) {
            dispatch(updateSecurity({ isLocked: true, lockedSince: 0 }));
        }
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentTime = new Date().getTime();
            if (currentTime - lockedSince > LOCKAFTER_TIME) {
                dispatch(updateSecurity({ isLocked: true, lockedSince: 0 }));
            }
        }, 60 * 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, [lockedSince]);

    return (
        <Router>
            <div className="my-2 mx-4 mt-0 font-mono">
                <NavBarAdmin />
                <Routes>
                    <Route path={basePath} element={<AdminHome />} />
                    <Route path={`${basePath}/discount`} element={<Discount />} />
                </Routes>
            </div>
        </Router>
    );
}

export default AppAdmin;
