
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { User, ViewState, Design, DesignType } from './types';

const App: React.FC = () => {
  // Default to guest user to satisfy "skip login" request
  const [user, setUser] = useState<User | null>({ id: 'guest', email: 'guest@demo.com' });
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [currentDesign, setCurrentDesign] = useState<Design | null>(null);
  const [initialType, setInitialType] = useState<DesignType>('OTHER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
        }
      } catch (error) {
        console.warn("Supabase auth check failed, defaulting to guest mode:", error);
      } finally {
        setLoading(false);
        // Ensure we end up in Dashboard if we are guest or logged in
        setViewState(ViewState.DASHBOARD);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        setViewState(ViewState.DASHBOARD);
      } else {
        // If explicitly signed out, maybe go to auth, or stay as guest?
        // For now, let's allow fallback to auth screen if they sign out manually
        // But initial load skips it.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setViewState(ViewState.AUTH);
  };

  const handleNewDesign = (type: DesignType, templateContent?: string) => {
    setInitialType(type);
    
    if (templateContent) {
        // Create a temporary design object with the template content
        setCurrentDesign({
            id: `temp_${Date.now()}`,
            user_id: user?.id || 'guest',
            prompt: 'Template based design',
            type: type,
            content: templateContent,
            created_at: new Date().toISOString(),
            title: 'Untitled Template'
        });
    } else {
        setCurrentDesign(null);
    }
    
    setViewState(ViewState.EDITOR);
  };

  const handleOpenDesign = (design: Design) => {
    setCurrentDesign(design);
    setViewState(ViewState.EDITOR);
  };

  const handleBackToDashboard = () => {
    setViewState(ViewState.DASHBOARD);
    setCurrentDesign(null);
  };

  // Render content even while loading to prevent white screen, just show spinner overlay if needed
  if (loading) {
     return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
               <i className="ph ph-spinner animate-spin text-3xl text-indigo-500"></i>
               <p className="text-zinc-500 text-sm">Initializing Studio...</p>
            </div>
        </div>
     );
  }

  return (
    <>
      {viewState === ViewState.AUTH && <Auth />}
      
      {viewState === ViewState.DASHBOARD && user && (
        <Dashboard 
            user={user} 
            onNewDesign={handleNewDesign} 
            onOpenDesign={handleOpenDesign}
            onLogout={handleLogout}
        />
      )}

      {viewState === ViewState.EDITOR && user && (
        <Editor 
            user={user} 
            design={currentDesign} 
            initialType={initialType}
            onBack={handleBackToDashboard}
        />
      )}
    </>
  );
};

export default App;
