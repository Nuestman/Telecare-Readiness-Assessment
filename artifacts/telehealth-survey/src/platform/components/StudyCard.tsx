import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { PublicStudyCard } from '@/platform/lib/api';
import { studyPaths } from '@/studies/telehealth-readiness/paths';

type StudyCardProps = {
  study: PublicStudyCard;
};

export function StudyCard({ study }: StudyCardProps) {
  const adminLogin =
    study.slug === 'telehealth-readiness'
      ? studyPaths.adminLogin
      : `/studies/${study.slug}/admin/login`;

  const badge =
    study.status === 'paused' ? (
      <Badge variant="secondary">Temporarily unavailable</Badge>
    ) : study.collectionOpen ? (
      <Badge className="bg-emerald-600">Accepting responses</Badge>
    ) : (
      <Badge variant="outline">Collection closed</Badge>
    );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{study.shortTitle}</CardTitle>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{study.organization}</p>
      </CardHeader>
      <CardContent className="flex-1 text-sm text-muted-foreground">
        {study.estimatedMinutes ? `~${study.estimatedMinutes} minutes` : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 items-stretch">
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={study.href}>Learn more</Link>
          </Button>
          <Button asChild className="flex-1" disabled={!study.collectionOpen}>
            <Link href={study.surveyHref}>Take survey</Link>
          </Button>
        </div>
        <Link href={adminLogin} className="text-xs text-muted-foreground hover:underline text-center">
          Research team login
        </Link>
      </CardFooter>
    </Card>
  );
}
