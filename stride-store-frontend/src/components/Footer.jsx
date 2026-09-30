import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-mark">S</span> STRIDE</div>
          <p>Engineered for Movement Where Every Step Counts.</p>
        </div>
        <div>
          <h4>Store</h4>
          <Link to="/shop">Shop all</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">Orders</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/account">My account</Link>
          <Link to="/cart">Cart</Link>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} STRIDE</div>
    </footer>
  );
}

export default Footer;
