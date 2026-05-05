import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Chặn null ngay từ đầu
      if (!action.payload || !action.payload.menuItem || !action.payload.menuItem._id) {
        console.warn('CartContext: Bỏ qua thêm món không hợp lệ', action.payload);
        return state;
      }

      const existingIndex = state.items.findIndex(
        (item) => item && item.menuItem && item.menuItem._id === action.payload.menuItem._id
      );

      if (existingIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + (action.payload.quantity || 1),
        };
        return { ...state, items: updatedItems };
      }

      return {
        ...state,
        items: [...state.items, { menuItem: action.payload.menuItem, quantity: action.payload.quantity || 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item && item.menuItem && item.menuItem._id !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items
        .map(item => {
          if (item && item.menuItem && item.menuItem._id === action.payload.menuItemId) {
            return { ...item, quantity: action.payload.quantity };
          }
          return item;
        })
        .filter(item => item && item.menuItem && item.quantity > 0);
      return { ...state, items: updatedItems };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = (menuItem, quantity = 1) => {
    if (!menuItem || !menuItem._id) {
      console.warn('addItem bị từ chối: menuItem không hợp lệ', menuItem);
      return;
    }
    dispatch({ type: 'ADD_ITEM', payload: { menuItem, quantity } });
  };

  const removeItem = (menuItemId) => dispatch({ type: 'REMOVE_ITEM', payload: menuItemId });
  const updateQuantity = (menuItemId, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { menuItemId, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      if (item && item.menuItem && typeof item.menuItem.price === 'number') {
        return total + item.menuItem.price * (item.quantity || 0);
      }
      return total;
    }, 0);
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => {
      return item && item.menuItem ? count + (item.quantity || 0) : count;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart, getCartTotal, getItemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);