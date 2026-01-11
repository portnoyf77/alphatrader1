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
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer showDisclaimer={showDisclaimer} />
    </div>
  );
}