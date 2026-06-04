import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <main className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Account and preference settings are not implemented yet. This page intentionally avoids fake toggles until backend persistence is added.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the backend foundation plan to add validated, server-persisted settings before exposing editable controls.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
