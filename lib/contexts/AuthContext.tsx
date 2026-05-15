/**
 * Context de Autenticação
 *
 * Gerencia estado de autenticação do cliente, login e encerramento por inatividade (1h).
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'COMERCIAL';
  /** false = conta criada só por Google; pode definir primeira senha em Ajustes sem "senha atual". */
  senhaLocalConfigurada?: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  /** Recarrega o utilizador a partir de `/api/auth/me` (ex.: após alterar senha). */
  refreshUsuario: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_ATIVIDADE = 'wp_auth_last_activity_at';
const LIMITE_INATIVIDADE_MS = 60 * 60 * 1000;
const INTERVALO_VERIFICACAO_MS = 30 * 1000;

function registrarAtividadeUsuario() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_ATIVIDADE, String(Date.now()));
  } catch {
    /* sessionStorage indisponível */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const encerrarSessaoPorInatividade = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_ATIVIDADE);
    } catch {
      /* ignore */
    }
    localStorage.removeItem('auth_token');
    setUsuario(null);
    window.location.href = '/login?motivo=inatividade';
  }, []);

  const carregarUsuario = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data.usuario);
        registrarAtividadeUsuario();
      } else {
        localStorage.removeItem('auth_token');
        try {
          sessionStorage.removeItem(STORAGE_ATIVIDADE);
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarUsuario();
  }, [carregarUsuario]);

  useEffect(() => {
    if (!usuario || typeof window === 'undefined') return;

    let ultimoThrottle = 0;
    const throttleMs = 20_000;

    const marcarAtividade = () => {
      const agora = Date.now();
      if (agora - ultimoThrottle < throttleMs) return;
      ultimoThrottle = agora;
      registrarAtividadeUsuario();
    };

    const verificarInatividade = () => {
      let ultimo: number;
      try {
        ultimo = Number(sessionStorage.getItem(STORAGE_ATIVIDADE) || '0');
      } catch {
        return;
      }
      if (!ultimo) return;
      if (Date.now() - ultimo > LIMITE_INATIVIDADE_MS) {
        encerrarSessaoPorInatividade();
      }
    };

    registrarAtividadeUsuario();
    const eventos: (keyof WindowEventMap)[] = [
      'mousemove',
      'keydown',
      'click',
      'touchstart',
      'scroll',
    ];
    const onAtividade = () => {
      marcarAtividade();
    };
    eventos.forEach((ev) => window.addEventListener(ev, onAtividade, { passive: true }));

    const intervalo = window.setInterval(verificarInatividade, INTERVALO_VERIFICACAO_MS);

    return () => {
      window.clearInterval(intervalo);
      eventos.forEach((ev) => window.removeEventListener(ev, onAtividade));
    };
  }, [usuario, encerrarSessaoPorInatividade]);

  const login = async (
    email: string,
    senha: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        setUsuario({
          ...data.usuario,
          senhaLocalConfigurada: data.usuario.senhaLocalConfigurada ?? true,
        });
        registrarAtividadeUsuario();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erro ao fazer login' };
      }
    } catch (error) {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(STORAGE_ATIVIDADE);
    } catch {
      /* ignore */
    }
    localStorage.removeItem('auth_token');
    setUsuario(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        logout,
        refreshUsuario: carregarUsuario,
        isAuthenticated: !!usuario,
        isAdmin: usuario?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
