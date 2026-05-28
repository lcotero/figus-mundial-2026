import React from 'react';
import { Shield, Database, Users, Sparkles } from 'lucide-react';

interface SignInViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorText?: string | null;
}

export default function SignInView({ onSignIn, isLoading, errorText }: SignInViewProps) {
  return (
    <div className="min-h-screen bg-fifa-bg flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-150 transition-all">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-fifa-green rounded-2xl flex items-center justify-center mb-4 shadow-md">
            <Sparkles className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Figus Mundial 2026
          </h2>
          <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            La herramienta definitiva para coleccionistas. Gestioná tu álbum en tu propio Google Sheets y cruzá repetidas con tus amigos al instante.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {errorText && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-medium leading-relaxed">
              {errorText}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start space-x-3 text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <Database className="h-5 w-5 text-fifa-green mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-slate-900">Tu Base de Datos Personal</span>
                Tus datos pertenecen a tu cuenta. Creamos una planilla ordenada en tu Google Drive para que la edites cuando quieras.
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <Users className="h-5 w-5 text-fifa-blue mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-slate-900">Trueque y Compatibilidad</span>
                Sumá amigos por mail o código QR y mirá al instante qué figuritas repetidas se pueden cambiar mutuamente.
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-705 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <Shield className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-slate-900">Privacidad y Seguridad</span>
                Usamos permisos mínimos. Solo accedemos a la planilla de figuritas creada por esta aplicación, sin tocar el resto de tus archivos.
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8 pt-4">
            <button
              id="google-signin-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className={`gsi-material-button w-full sm:w-auto flex justify-center items-center py-3.5 px-6 border border-slate-200 rounded-xl shadow-md text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fifa-green transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ minWidth: '240px' }}
            >
              <div className="gsi-material-button-content-wrapper flex items-center space-x-3">
                <div className="gsi-material-button-icon shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-semibold text-slate-800">
                  {isLoading ? 'Conectando...' : 'Iniciar Sesión con Google'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
