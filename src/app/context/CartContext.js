"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [productsList, setProductsList] = useState([]);

  // Load cart and products from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem("dar_mroani_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart data from localStorage", e);
      }
    }

    const savedProducts = localStorage.getItem("dar_mroani_products");
    if (savedProducts) {
      try {
        setProductsList(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Error parsing products data from localStorage", e);
      }
    } else {
      // Load static products and save them
      import("../data/products").then((module) => {
        setProductsList(module.products);
        localStorage.setItem("dar_mroani_products", JSON.stringify(module.products));
      });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("dar_mroani_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: product.quantity || 1 }];
    });
    // Open the cart drawer when adding an item
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Admin Products helpers
  const addProduct = (newProduct) => {
    setProductsList((prev) => {
      const updated = [newProduct, ...prev];
      localStorage.setItem("dar_mroani_products", JSON.stringify(updated));
      return updated;
    });
  };

  const updateProduct = (updatedProduct) => {
    setProductsList((prev) => {
      const updated = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      localStorage.setItem("dar_mroani_products", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteProduct = (id) => {
    setProductsList((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem("dar_mroani_products", JSON.stringify(updated));
      return updated;
    });
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isMounted,
        productsList,
        addProduct,
        updateProduct,
        deleteProduct
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
