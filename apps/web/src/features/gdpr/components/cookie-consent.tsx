import { t } from "@lingui/core/macro";
import { useState, useEffect } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@reactive-resume/ui/components/card";

const COOKIE_CONSENT_KEY = "gdpr-cookie-consent";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!saved) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const prefs: CookiePreferences = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setShow(false);
  };

  const acceptNecessary = () => {
    const prefs: CookiePreferences = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setShow(false);
  };

  const savePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">{t`Cookie Consent`}</CardTitle>
          <CardDescription>{t`We use cookies to enhance your experience. Manage your preferences below.`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={preferences.necessary} disabled className="size-4" />
            <div>
              <p className="font-medium text-sm">{t`Necessary Cookies`}</p>
              <p className="text-muted-foreground text-xs">{t`Required for the website to function properly.`}</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
              className="size-4"
            />
            <div>
              <p className="font-medium text-sm">{t`Analytics Cookies`}</p>
              <p className="text-muted-foreground text-xs">{t`Help us understand how you use the website.`}</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences((p) => ({ ...p, marketing: e.target.checked }))}
              className="size-4"
            />
            <div>
              <p className="font-medium text-sm">{t`Marketing Cookies`}</p>
              <p className="text-muted-foreground text-xs">{t`Used to deliver relevant advertisements.`}</p>
            </div>
          </label>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={acceptNecessary}>{t`Necessary Only`}</Button>
          <Button variant="outline" size="sm" onClick={savePreferences}>{t`Save Preferences`}</Button>
          <Button size="sm" onClick={acceptAll}>{t`Accept All`}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
