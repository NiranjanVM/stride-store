import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiShoppingBag, FiWatch, FiActivity, FiLayers } from "react-icons/fi";
import { api } from "../services/api";

const categoryStyles = ["category-dark", "category-light", "category-accent", "category-plain", "category-dark"];
const categoryIcons = [FiShoppingBag, FiLayers, FiWatch, FiActivity, FiShoppingBag];

function Home() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getCategories()
      .then((result) => setCategories(Array.isArray(result) ? result : result?.categories || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THE NEW COLLECTION</span>
          <h1>MOVE<br /><span>YOUR WAY.</span></h1>
          <p>Performance-led essentials designed for everyday movement.</p>
          <Link className="button button-light" to="/shop">Shop collection <FiArrowUpRight /></Link>
        </div>
        <div className="hero-shape">
          <div className="hero-circle">STRIDE</div>
          <div className="hero-word">MOVE</div>
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SHOP BY CATEGORY</span>
            <h2>Find your lane.</h2>
          </div>
          <Link to="/shop" className="text-link">View all <FiArrowUpRight /></Link>
        </div>

        {categories.length ? (
          <div className="category-grid category-grid-dynamic">
            {categories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return (
                <Link
                  key={category.id}
                  to={`/shop?category=${encodeURIComponent(category.name)}`}
                  className={`category-card ${categoryStyles[index % categoryStyles.length]}`}
                >
                  <div className="category-card-top">
                    <span>0{index + 1}</span>
                    <Icon />
                  </div>
                  <strong>{category.name}</strong>
                  <em>Explore <FiArrowUpRight /></em>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="category-grid category-grid-dynamic">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="category-card category-loading" key={index} />
            ))}
          </div>
        )}
      </section>

      <section className="feature-strip">
        <div><span>01</span><h3>Built to Move</h3><p>Performance footwear designed for every step, sprint, and everyday adventure.</p></div>
        <div><span>02</span><h3>Made for the Streets</h3><p>Iconic sneakers combining bold style, comfort, and street-ready design.</p></div>
        <div><span>03</span><h3>Comfort Meets Performance</h3><p>Engineered cushioning and responsive support to keep you moving all day.</p></div>
      </section>
    </>
  );
}

export default Home;
