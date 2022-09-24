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
  return (
    <Router>
      <div>
        <nav className="text-gray-800 border-gray-200 border-b">
          <ul className="flex px-3">
            <li>
              <NavLink
                exact
                to="/"
                className="inline-block px-2 py-1 "
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/product-product"
                className="inline-block px-2 py-1"
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Productos
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/purchase-order"
                className="inline-block px-2 py-1"
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Ordenes de Compra
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reports"
                className="inline-block px-2 py-1"
                activeClassName="bg-gray-100 text-gray-900"
                tabIndex={-1}
              >
                Reportes
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/refunds"
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
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/product-product">
            <ProductProduct />
          </Route>
          <Route path="/purchase-order">
            <PurchaseOrder />
          </Route>
          <Route path="/reports">
            <Report />
          </Route>
          <Route path="/refunds">
            <Refund />
          </Route>
        </Switch>
      </div>
    </Router>
  );
};
