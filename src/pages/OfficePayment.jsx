import { t } from '@/i18n';

export default function OfficePayment() {
  return (
    <div className="max-w-xl mx-auto space-y-4" dir="rtl">
      <h2 className="text-2xl font-bold">{t('paymentTitle')}</h2>
      <p className="text-slate-700">Coming soon: billing options for your office.</p>
    </div>
  );
}
