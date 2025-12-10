import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Anchor, UserPlus, LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!isLogin && !email.trim()) {
      setError('O e-mail é obrigatório para cadastro.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const success = await login(username, password);
        if (!success) setError('Usuário ou senha incorretos.');
      } else {
        const success = await register(username, email, password);
        if (!success) setError('Este nome de usuário já existe.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6] p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header - Matches the amber color in screenshot */}
        <div className="bg-[#8B4513] p-8 text-center relative overflow-hidden">
           {/* Decorative circle arc hint from screenshot - purely CSS */}
           <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 mx-auto bg-amber-700/50 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner border border-amber-600/50">
            <Anchor className="w-8 h-8 text-amber-100" />
          </div>
          <h1 className="relative z-10 text-2xl font-bold text-white mb-1">Porto Logístico</h1>
          <p className="relative z-10 text-amber-200 text-sm">Gerenciador de Recursos Ikariam</p>
        </div>

        <div className="p-8">
          {/* Tabs */}
          <div className="flex justify-center mb-6 border-b border-stone-200">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`pb-3 px-6 text-sm font-medium transition-colors relative ${isLogin ? 'text-[#8B4513]' : 'text-stone-400 hover:text-stone-600'}`}
            >
              Entrar
              {isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8B4513]"></div>}
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`pb-3 px-6 text-sm font-medium transition-colors relative ${!isLogin ? 'text-[#8B4513]' : 'text-stone-400 hover:text-stone-600'}`}
            >
              Criar Conta
              {!isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8B4513]"></div>}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Nome de Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full rounded-md border border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3 bg-white text-black placeholder-stone-400"
                  placeholder="Seu nick ou nome"
                />
              </div>
            </div>

            {/* Email Field (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="email"
                    required={!isLogin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full rounded-md border border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3 bg-white text-black placeholder-stone-400"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Senha
              </label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full rounded-md border border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3 bg-white text-black placeholder-stone-400"
                  placeholder="******"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded text-center border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8B4513] hover:bg-[#723a0f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-70 mt-6"
            >
              {isLoading ? (
                'Processando...'
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {isLogin ? 'Entrar' : 'Registrar'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-400">
            Armazenamento local simulado. Seus dados persistem neste navegador.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;