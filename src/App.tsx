import React from 'react';
import { Route, Switch } from 'wouter';
import { Navbar } from './components/common/Navbar';
import { FloatingBalloons } from './components/common/FloatingBalloons';
import { ToastProvider } from './components/common/Toast';
import { HomePage } from './pages/HomePage';
import { CreateBirthday } from './components/admin/CreateBirthday';
import { AdminPage } from './pages/AdminPage';
import { BirthdayPage } from './pages/BirthdayPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-celebration-pink selection:text-white">
        {/* Ambient floating balloons & background glowing orbs */}
        <FloatingBalloons />

        {/* Global Glassmorphism Navigation */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 relative z-10">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/create" component={CreateBirthday} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/admin/:token" component={AdminPage} />
            <Route path="/birthday/:token" component={BirthdayPage} />
            <Route>
              <div className="text-center py-24 space-y-4">
                <div className="text-5xl">🎂</div>
                <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
                <a href="/" className="text-sm text-gold-400 hover:underline">
                  Return to Home
                </a>
              </div>
            </Route>
          </Switch>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>🎂</span>
              <span className="font-semibold text-slate-300">BirthdayMagic Platform</span>
              <span>• Making Birthdays Unforgettable</span>
            </div>
            <div>Built with ❤️ for Indian Celebrations (+91)</div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
};
export default App;
