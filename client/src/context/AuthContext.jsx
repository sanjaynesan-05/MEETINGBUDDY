import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/authAPI';

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: true,
  error: null,
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER',
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ACTIONS.SET_USER:
      return { ...state, user: action.payload, loading: false };

    default:
      return state;
  }
}

// Context
const AuthContext = createContext(null);

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const res = await authAPI.getProfile();
        dispatch({
          type: ACTIONS.SET_USER,
          payload: res.data.user,
        });
      } catch {
        // Token invalid/expired — clear it
        dispatch({ type: ACTIONS.LOGOUT });
      }
    };

    verifyToken();
  }, []);

  // Actions
  const register = async (name, email, password) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });
      const res = await authAPI.register({ name, email, password });
      dispatch({
        type: ACTIONS.LOGIN_SUCCESS,
        payload: { token: res.data.token, user: res.data.user },
      });
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({ type: ACTIONS.SET_ERROR, payload: message });
      return { success: false, message };
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });
      const res = await authAPI.login({ email, password });
      dispatch({
        type: ACTIONS.LOGIN_SUCCESS,
        payload: { token: res.data.token, user: res.data.user },
      });
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: ACTIONS.SET_ERROR, payload: message });
      return { success: false, message };
    }
  };

  const logout = () => {
    dispatch({ type: ACTIONS.LOGOUT });
  };

  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout,
    clearError,
    isAuthenticated: !!state.token && !!state.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
