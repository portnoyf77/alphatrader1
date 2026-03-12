import { useState } from 'react';
import { FileDown, Copy, Check, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from 'sonner';

const DOC_PATH = '/docs/alpha-trader-internal-docs.md';
const SITEMAP_PATH = '/docs/alpha-trader-sitemap.md';

export default function Docs() {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = DOC_PATH;
    link.download = 'alpha-trader-internal-docs.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Documentation downloaded');
  };

  const handleCopyLink = async () => {
    const fullUrl = `${window.location.origin}${DOC_PATH}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(DOC_PATH, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Internal Documentation</h1>
            <p className="text-muted-foreground">
              Alpha Trader product documentation for stakeholders
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                alpha-trader-internal-docs.md
              </CardTitle>
              <CardDescription>
                Comprehensive internal product document covering platform overview, 
                data models, fee structure, and technical architecture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleDownload} className="flex-1 gap-2">
                  <FileDown className="h-4 w-4" />
                  Download Markdown
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink} 
                  className="flex-1 gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={handleOpenInNewTab}
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium mb-2">Document Contents</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Executive Summary & Value Proposition</li>
                  <li>• Core Concepts & Terminology</li>
                  <li>• Portfolio Lifecycle & Validation</li>
                  <li>• Data Models & Fee Structure</li>
                  <li>• Technical Architecture</li>
                  <li>• Route Structure & UI Guidelines</li>
                </ul>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                💡 <strong>Tip:</strong> Convert to PDF using VS Code, Notion, or{' '}
                <a 
                  href="https://markdowntopdf.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  markdowntopdf.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
