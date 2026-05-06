import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      if (!action.payload?.menuItem?._id) {
        console.warn('CartContext: Bỏ qua thêm món không hợp lệ', action.payload);
        return state;
      }
      const existingIndex = state.items.findIndex(
        item => item.type === 'item' && item.menuItem?._id === action.payload.menuItem._id
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
        items: [
          ...state.items,
          { type: 'item', menuItem: action.payload.menuItem, quantity: action.payload.quantity || 1 }
        ],
      };
    }

    case 'ADD_COMBO': {
      const combo = action.payload.combo;
      if (!combo?._id) return state;

      // Kiểm tra combo đã có trong giỏ chưa
      const existingIndex = state.items.findIndex(
        item => item.type === 'combo' && item.comboId === combo._id
      );

      if (existingIndex >= 0) {
        // Tăng số lượng
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + (action.payload.quantity || 1),
        };
        return { ...state, items: updatedItems };
      }

      // Thêm mới
      return {
        ...state,
        items: [
          ...state.items,
          {
            type: 'combo',
            comboId: combo._id,
            name: combo.name,
            price: combo.price,
            image: combo.image || '',
            items: combo.items,
            quantity: action.payload.quantity || 1,
          },
        ],
      };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => {
          if (item.type === 'combo') return item.comboId !== action.payload;
          return item.menuItem?._id !== action.payload;
        }),
      };
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items
        .map(item => {
          if (item.type === 'combo' && item.comboId === action.payload.id) {
            return { ...item, quantity: action.payload.quantity };
          }
          if (item.type === 'item' && item.menuItem?._id === action.payload.id) {
            return { ...item, quantity: action.payload.quantity };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
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
    if (!menuItem?._id) return;
    dispatch({ type: 'ADD_ITEM', payload: { menuItem, quantity } });
  };

  const addCombo = (combo, quantity = 1) => {
    if (!combo?._id) return;
    dispatch({ type: 'ADD_COMBO', payload: { combo, quantity } });
  };

  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });

  const updateQuantity = (id, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      if (item.type === 'combo') {
        return total + (item.price * item.quantity);
      }
      if (item.menuItem?.price) {
        return total + (item.menuItem.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        addCombo,
        removeItem,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);