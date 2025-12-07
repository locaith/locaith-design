
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="z-10 w-full max-w-md p-8 space-y-8 bg-surface border border-white/5 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
             <i className="ph ph-magic-wand text-3xl text-white"></i>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Locaith Design</h2>
          <p className="text-secondary">AI-Powered Professional Design Suite</p>
        </div>
        
        <div className="space-y-4">
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-white/10 rounded-xl text-white bg-white/5 hover:bg-white/10 transition-all duration-200 font-medium group"
            >
                {loading ? (
                    <i className="ph ph-spinner animate-spin text-xl"></i>
                ) : (
                    <>
                        <i className="ph ph-google-logo text-xl group-hover:text-primary transition-colors"></i>
                        <span>Continue with Google</span>
                    </>
                )}
            </button>
        </div>
        
        <p className="text-xs text-center text-zinc-600">
            By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
