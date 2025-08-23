const messages = {
  he: {
    homeNav: 'בית',
    checkNav: 'בדיקת זמינות',
    newMeetingNav: 'ישיבה חדשה',
    myMeetingsNav: 'הישיבות שלי',
    historyNav: 'היסטוריה',
    orgMembersNav: 'חברים בארגון',
    contactsNav: 'אנשי קשר',
    contactUsNav: 'צור קשר',
    subscriptionNav: 'מנויים',
    settingsNav: 'הגדרות',
    brandingNav: 'מיתוג',
    paymentNav: 'תשלום',
    brandingTitle: 'מיתוג משרד',
    brandingLogo: 'לוגו',
    brandingBanner: 'תמונת רקע',
    save: 'שמור',
    paymentTitle: 'תשלום למשרד',
    language: 'שפה'
  },
  en: {
    homeNav: 'Home',
    checkNav: 'Check Availability',
    newMeetingNav: 'New Meeting',
    myMeetingsNav: 'My Meetings',
    historyNav: 'History',
    orgMembersNav: 'Organization Members',
    contactsNav: 'Contacts',
    contactUsNav: 'Contact Us',
    subscriptionNav: 'Subscription',
    settingsNav: 'Settings',
    brandingNav: 'Branding',
    paymentNav: 'Payment',
    brandingTitle: 'Office Branding',
    brandingLogo: 'Logo',
    brandingBanner: 'Banner Image',
    save: 'Save',
    paymentTitle: 'Office Payment',
    language: 'Language'
  }
};

const storage = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {} };
let currentLang = storage.getItem('lang') || 'he';

export const t = (key) => messages[currentLang][key] || key;
export const setLanguage = (lang) => {
  currentLang = lang;
  storage.setItem('lang', lang);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('languagechange'));
  }
};
export const getLanguage = () => currentLang;
