import { useState } from 'react';
import { FileDown, Copy, Check, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from 'sonner';

const DOC_PATH = '/docs/alpha-trader-internal-docs.md';
const SITEMAP_PATH = '/docs/alpha-trader-sitemap.md';

interface DocFile {
  path: string;
  filename: string;
  title: string;
  description: string;
  contents: string[];
}

const docs: DocFile[] = [
  {
    path: DOC_PATH,
    filename: 'alpha-trader-internal-docs.md',
    title: 'Internal Documentation',
    description: 'Comprehensive internal product document covering platform overview, data models, fee structure, and technical architecture.',
    contents: [
      'Executive Summary & Value Proposition',
      'Core Concepts & Terminology',
      'Portfolio Lifecycle & Validation',
      'Data Models & Fee Structure',
      'Technical Architecture',
      'Route Structure & UI Guidelines',
    ],
  },
  {
    path: SITEMAP_PATH,
    filename: 'alpha-trader-sitemap.md',
    title: 'Full Site Map & Command Reference',
    description: 'Complete site map with every route, page element, available commands, modals, navigation paths, and access levels.',
    contents: [
      'Navigation Graph',
      'Global Components (Navbar)',
      'All 13+ Routes with Access Levels',
      'Per-Page Command Tables',
      'Modals & Dialog Inventory',
      'Toast Notification Reference',
    ],
  },
];

export default function Docs() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleDownload = (doc: DocFile) => {
    const link = document.createElement('a');
    link.href = doc.path;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Documentation downloaded');
  };

  const handleCopyLink = async (doc: DocFile, idx: number) => {
    const fullUrl = `${window.location.origin}${doc.path}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedIdx(idx);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleOpenInNewTab = (doc: DocFile) => {
    window.open(doc.path, '_blank');
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
            <h1 className="text-3xl font-bold mb-2">Documentation</h1>
            <p className="text-muted-foreground">
              Alpha Trader product documentation for stakeholders
            </p>
          </div>

          <div className="space-y-6">
            {docs.map((doc, idx) => (
              <Card key={doc.path} className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {doc.filename}
                  </CardTitle>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => handleDownload(doc)} className="flex-1 gap-2">
                      <FileDown className="h-4 w-4" />
                      Download Markdown
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCopyLink(doc, idx)}
                      className="flex-1 gap-2"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedIdx === idx ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => handleOpenInNewTab(doc)}
                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>

                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-medium mb-2">Document Contents</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {doc.contents.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-6">
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
        </div>
      </main>
    </div>
  );
}
