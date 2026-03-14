import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { BackgroundOrbs } from "@/components/BackgroundOrbs";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageLayout>
      <div className="flex min-h-[60vh] items-center justify-center -mt-20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
              <Crown className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 font-heading" style={{ fontSize: '4rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.15)' }}>404</h1>
          <p className="mb-8" style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.55)' }}>Page not found</p>
          <Button asChild size="lg">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFound;
