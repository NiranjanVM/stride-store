import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiGrid, FiMenu, FiX } from "react-icons/fi";
import { IoBagHandle } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { IoIosLogOut } from "react-icons/io";
import { FiUser } from "react-icons/fi";
function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.getCategories()
      .then((result) => setCategories(Array.isArray(result) ? result : result?.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setCategoryOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }

    api.getCart()
      .then((data) => {
        setCartCount((data.items || []).reduce((sum, item) => sum + Number(item.quantity), 0));
      })
      .catch(() => setCartCount(0));
  }, [isAuthenticated]);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  function closeMenus() {
    setMenuOpen(false);
    setCategoryOpen(false);
  }

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={closeMenus}>
          <span className="brand-mark">S</span>
          <span>STRIDE</span>
        </Link>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/shop" onClick={closeMenus}>Shop</NavLink>

          <div className="nav-category-menu">
            <button
              className={`nav-category-trigger ${location.pathname === "/shop" && location.search.includes("category=") ? "active" : ""}`}
              onClick={() => setCategoryOpen((open) => !open)}
              aria-expanded={categoryOpen}
            >
              <FiGrid />
              Categories
              <FiChevronDown className={categoryOpen ? "chevron-open" : ""} />
            </button>

            {categoryOpen && (
              <div className="category-dropdown">
                <Link to="/shop" onClick={closeMenus} className="category-dropdown-all">
                  All products
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/shop?category=${encodeURIComponent(category.name)}`}
                    onClick={closeMenus}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/shop?gender=men" onClick={closeMenus}>Men</NavLink>
          <NavLink to="/shop?gender=women" onClick={closeMenus}>Women</NavLink>
          <NavLink to="/wishlist" onClick={closeMenus}>Wishlist</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/orders" onClick={closeMenus}>Orders</NavLink>
              <NavLink to="/account" onClick={closeMenus}>Account</NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={closeMenus}>Admin</NavLink>
          )}
        </nav>

      <div className="nav-actions">
  <Link
    className="icon-button cart-button"
    to="/cart"
    aria-label="Cart"
  >
    <IoBagHandle />
    {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
  </Link>

  {user && <span className="nav-user">Hi, {user.name}</span>}

{isAuthenticated ? (
  <button
    className="button button-dark nav-login"
    onClick={handleLogout}
    aria-label="Logout"
  >
    <span className="nav-login-text">Logout</span>
    <IoIosLogOut className="nav-login-icon" />
  </button>
) : (
  <Link
    className="button button-dark nav-login"
    to="/login"
    aria-label="Login"
  >
    <span className="nav-login-text">Login</span>
    <FiUser className="nav-login-icon" />
  </Link>
)}
</div>
      </div>
    </header>
  );
}

export default Navbar;
