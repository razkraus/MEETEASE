import { useEffect, useState } from 'react';
import { Organization, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { t } from '@/i18n';

export default function OfficeBranding() {
  const [branding, setBranding] = useState({ logoUrl: '', bannerUrl: '' });

  useEffect(() => {
    async function load() {
      const user = await User.me();
      if (user.organization_id) {
        const org = await Organization.get(user.organization_id);
        if (org?.branding) setBranding(org.branding);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    const user = await User.me();
    if (user.organization_id) {
      await Organization.update(user.organization_id, { branding });
      alert(t('save'));
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4" dir="rtl">
      <h2 className="text-2xl font-bold">{t('brandingTitle')}</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium">{t('brandingLogo')}</label>
        <Input value={branding.logoUrl} onChange={e => setBranding(b => ({ ...b, logoUrl: e.target.value }))} placeholder="https://" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">{t('brandingBanner')}</label>
        <Input value={branding.bannerUrl} onChange={e => setBranding(b => ({ ...b, bannerUrl: e.target.value }))} placeholder="https://" />
      </div>
      <Button onClick={handleSave}>{t('save')}</Button>
    </div>
  );
}
