import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  NavLink,
  Routes,
} from "react-router-dom";

const Home = React.lazy(() => import("../home/Home"));
const ProductProduct = React.lazy(
  () => import("../product_product/ProductProduct")
);
const PurchaseOrder = React.lazy(
  () => import("../purchase_order/PurchaseOrder")
);
const Refund = React.lazy(() => import("../refund/Refund"));
const Report = React.lazy(() => import("../report/Report"));

export const Navbar = () => {
  const basePath = "/apps/product-rpc";
  return (
    <Router>
      <div>
        <nav className="text-gray-800 border-gray-200 border-b">
          <ul className="flex px-3">
            <li>
              <NavLink
                end
                to={basePath}
                className={(navData) =>
                  `inline-block px-2 py-1 ${
                    navData.isActive ? "bg-gray-100 text-gray-900" : ""
                  }`
                }
                tabIndex={-1}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/product-product`}
                className={(navData) =>
                  `inline-block px-2 py-1 ${
                    navData.isActive ? "bg-gray-100 text-gray-900" : ""
                  }`
                }
                tabIndex={-1}
              >
                Productos
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/purchase-order`}
                className={(navData) =>
                  `inline-block px-2 py-1 ${
                    navData.isActive ? "bg-gray-100 text-gray-900" : ""
                  }`
                }
                tabIndex={-1}
              >
                Ordenes de Compra
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/reports`}
                className={(navData) =>
                  `inline-block px-2 py-1 ${
                    navData.isActive ? "bg-gray-100 text-gray-900" : ""
                  }`
                }
                tabIndex={-1}
              >
                Reportes
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/refunds`}
                className={(navData) =>
                  `inline-block px-2 py-1 ${
                    navData.isActive ? "bg-gray-100 text-gray-900" : ""
                  }`
                }
                tabIndex={-1}
              >
                Cambios
              </NavLink>
            </li>
          </ul>
        </nav>
        <Suspense fallback={<div />}>
          <Routes>
            <Route path={basePath} element={<Home />} />
            <Route
              path={`${basePath}/product-product`}
              element={<ProductProduct />}
            />
            <Route
              path={`${basePath}/purchase-order`}
              element={<PurchaseOrder />}
            />
            <Route path={`${basePath}/reports`} element={<Report />} />
            <Route path={`${basePath}/refunds`} element={<Refund />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};
