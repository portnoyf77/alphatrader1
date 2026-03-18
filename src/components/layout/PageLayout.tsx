import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  showDisclaimer?: boolean;
}

export function PageLayout({ children, showDisclaimer = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 relative z-0">
        {children}
      </main>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <Footer showDisclaimer={showDisclaimer} />
    </div>
  );
}