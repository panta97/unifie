import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  NavLink,
  Routes,
} from "react-router-dom";

const Home = React.lazy(() => import("../home/Home"));
const ProductProduct = React.lazy(() => import("../product_product/ProductProduct"));
const PurchaseOrder = React.lazy(() => import("../purchase_order/PurchaseOrder"));
const Credit = React.lazy(() => import("../credit/Credit"));
const Refund = React.lazy(() => import("../refund/Refund"));
const Report = React.lazy(() => import("../report/Report"));

export const Navbar: React.FC = () => {
  const basePath = "/apps/product-rpc";

  const handleReload = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault();
    window.location.href = path;
  };

  return (
    <Router>
      <div>
        <nav className="text-gray-800 border-gray-200 border-b">
          <ul className="flex px-3">
            <li>
              <NavLink
                end
                to={basePath}
                className={({ isActive }) => `inline-block px-2 py-1 ${isActive ? "bg-gray-100 text-gray-900" : ""}`}
                tabIndex={-1}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/product-product`}
                className={({ isActive }) => `inline-block px-2 py-1 ${isActive ? "bg-gray-100 text-gray-900" : ""}`}
                tabIndex={-1}
              >
                Productos
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/purchase-order`}
                className={({ isActive }) => `inline-block px-2 py-1 ${isActive ? "bg-gray-100 text-gray-900" : ""}`}
                tabIndex={-1}
              >
                Ordenes de Compra
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/reports`}
                className={({ isActive }) => `inline-block px-2 py-1 ${isActive ? "bg-gray-100 text-gray-900" : ""}`}
                tabIndex={-1}
              >
                Reportes
              </NavLink>
            </li>
            <li>
              <a
                href={`${basePath}/refunds`}
                onClick={(e) => handleReload(e, `${basePath}/refunds`)}
                className="inline-block px-2 py-1"
              >
                Cambios
              </a>
            </li>
            <li>
              <a
                href={`${basePath}/credit-notes`}
                onClick={(e) => handleReload(e, `${basePath}/credit-notes`)}
                className="inline-block px-2 py-1"
              >
                Validar Nota de Crédito
              </a>
            </li>
          </ul>
        </nav>
        <Suspense fallback={<div />}>
          <Routes>
            <Route path={basePath} element={<Home />} />
            <Route path={`${basePath}/product-product`} element={<ProductProduct />} />
            <Route path={`${basePath}/purchase-order`} element={<PurchaseOrder />} />
            <Route path={`${basePath}/reports`} element={<Report />} />
            <Route path={`${basePath}/refunds`} element={<Refund />} />
            <Route path={`${basePath}/credit-notes`} element={<Credit />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};
