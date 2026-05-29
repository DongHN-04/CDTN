import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { useAuth } from './AuthContext';

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
            description: combo.description || '',
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

    case 'REPLACE_CART':
      return {
        items: Array.isArray(action.payload?.items) ? action.payload.items : [],
        storageKey: action.payload?.storageKey,
      };

    case 'REFRESH_PRODUCTS': {
      const menuMap = new Map((action.payload?.menuItems || []).map(item => [item._id, item]));
      const comboMap = new Map((action.payload?.combos || []).map(combo => [combo._id, combo]));

      return {
        ...state,
        items: state.items.map(item => {
          if (item.type === 'combo') {
            const freshCombo = comboMap.get(item.comboId);
            return freshCombo
              ? {
                  ...item,
                  name: freshCombo.name,
                  price: freshCombo.price,
                  image: freshCombo.image || '',
                  items: freshCombo.items,
                  description: freshCombo.description || '',
                  isAvailable: freshCombo.isAvailable,
                }
              : { ...item, isAvailable: false };
          }

          const freshItem = menuMap.get(item.menuItem?._id);
          return freshItem
            ? { ...item, menuItem: freshItem }
            : { ...item, menuItem: { ...(item.menuItem || {}), isAvailable: false } };
        }),
      };
    }

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const cartStorageKey = user?._id ? `cart:${user._id}` : 'cart:guest';

  const [state, dispatch] = useReducer(cartReducer, { items: [], storageKey: 'cart:guest' }, () => {
    try {
      // Xoa key cu dung chung de tranh lay lai gio hang cua tai khoan khac.
      localStorage.removeItem('cart');
      const saved = JSON.parse(localStorage.getItem('cart:guest'));
      return saved && Array.isArray(saved.items)
        ? { items: saved.items, storageKey: 'cart:guest' }
        : { items: [], storageKey: 'cart:guest' };
    } catch {
      localStorage.removeItem('cart:guest');
      return { items: [], storageKey: 'cart:guest' };
    }
  });

  useEffect(() => {
    if (loading) return;

    try {
      // Moi tai khoan co gio hang rieng; guest cung co gio rieng khi chua dang nhap.
      const saved = JSON.parse(localStorage.getItem(cartStorageKey));
      dispatch({
        type: 'REPLACE_CART',
        payload: {
          items: saved && Array.isArray(saved.items) ? saved.items : [],
          storageKey: cartStorageKey,
        },
      });
    } catch {
      localStorage.removeItem(cartStorageKey);
      dispatch({ type: 'REPLACE_CART', payload: { items: [], storageKey: cartStorageKey } });
    }
  }, [cartStorageKey, loading]);

  useEffect(() => {
    if (loading) return;
    if (state.storageKey !== cartStorageKey) return;
    localStorage.setItem(cartStorageKey, JSON.stringify(state));
  }, [cartStorageKey, loading, state]);

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

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const refreshCartProducts = useCallback(({ menuItems = [], combos = [] }) => {
    dispatch({ type: 'REFRESH_PRODUCTS', payload: { menuItems, combos } });
  }, []);

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
        refreshCartProducts,
        getCartTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
