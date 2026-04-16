'use client';

import { FileText, Download, Shield, AlertTriangle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PropertyDocument } from '@/types';

interface PropertyDocumentsProps {
  documents: PropertyDocument[];
  assetTitle?: string;
}

export function PropertyDocuments({ documents }: PropertyDocumentsProps) {
  const t = useTranslations('documents');

  const documentIcon = (type: PropertyDocument['type']) => {
    if (type === 'cronograma_obra') return Clock;
    if (type === 'laudo_tecnico') return Shield;
    return FileText;
  };

  const getVerificationBadge = (verified: boolean) =>
    verified ? (
      <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 text-xs">
        <Shield className="w-3 h-3 mr-1" />
        {t('verified')}
      </Badge>
    ) : (
      <Badge className="bg-amber-400/10 text-amber-400 border border-amber-400/30 text-xs">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {t('inReview')}
      </Badge>
    );

  const handleDownload = (doc: PropertyDocument) => {
    console.log('Download:', doc.title, doc.hash);
    alert(`${t('download')}: ${doc.title}\nHash: ${doc.hash}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#14F195]" />
          {t('title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('empty')}</p>
          </div>
        ) : (
          documents.map((doc) => {
            const IconComponent = documentIcon(doc.type);
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-[#14F195]/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{doc.title}</h4>
                      {getVerificationBadge(doc.verified)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t(`types.${doc.type}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                    {doc.hash && (
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        Hash: {doc.hash.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(doc)}
                  className="border-[#14F195]/30 hover:bg-[#14F195]/5 hover:border-[#14F195]/50 text-muted-foreground hover:text-[#14F195]"
                >
                  <Download className="w-3 h-3 mr-1" />
                  {t('download')}
                </Button>
              </div>
            );
          })
        )}

        <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-dashed border-border">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#14F195] mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1">{t('transparencyTitle')}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{t('transparencyText')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
