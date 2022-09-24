import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
} from "react-router-dom";
import { Home } from "../home/Home";
import { ProductProduct } from "../product_product/ProductProduct";
import { PurchaseOrder } from "../purchase_order/PurchaseOrder";
import { Refund } from "../refund/Refund";
import { Report } from "../report/Report";

export const Navbar = () => {
  const basePath = "/apps/product-rpc";
  return (
    <Router>
      <div>
        <nav className="text-gray-800 border-gray-200 border-b">
          <ul className="flex px-3">
            <li>
              <NavLink
                exact
                to={basePath}
                className="inline-block px-2 py-1 "
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/product-product`}
                className="inline-block px-2 py-1"
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Productos
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/purchase-order`}
                className="inline-block px-2 py-1"
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Ordenes de Compra
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/reports`}
                className="inline-block px-2 py-1"
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Reportes
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${basePath}/refunds`}
                className="inline-block px-2 py-1"
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Cambios
              </NavLink>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route exact path={basePath}>
            <Home />
          </Route>
          <Route path={`${basePath}/product-product`}>
            <ProductProduct />
          </Route>
          <Route path={`${basePath}/purchase-order`}>
            <PurchaseOrder />
          </Route>
          <Route path={`${basePath}/reports`}>
            <Report />
          </Route>
          <Route path={`${basePath}/refunds`}>
            <Refund />
          </Route>
        </Switch>
      </div>
    </Router>
  );
};
