import React, { useState, useEffect } from 'react';
import { User, Feedback } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, LifeBuoy, Send, CheckCircle, Smartphone } from 'lucide-react';

const faqItems = [
    {
        question: "איך עובדת האינטגרציה עם היומן שלי?",
        answer: "במנוי פרימיום, המערכת מתחברת ליומן Google או Outlook שלך. היא סורקת אוטומטית זמנים פנויים לך ולשאר המשתתפים בישיבה (שיש להם הרשאה) ומציעה רק מועדים שמתאימים לכולם. זה חוסך את הצורך בתיאומים ידניים."
    },
    {
        question: "האם משתתפים חיצוניים צריכים להירשם למערכת?",
        answer: "לא! משתתפים חיצוניים לא צריכים להירשם. הם מקבלים קישור ייחודי למייל שבו הם יכולים לסמן את זמינותם. התהליך פשוט ומהיר עבורם."
    },
    {
        question: "מה קורה אם אף אחד מהמועדים שהצעתי לא מתאים?",
        answer: "אם אף מועד לא מתאים לכל המשתתפים, תקבל על כך הודעה. תוכל להיכנס לישיבה, לראות את הזמינות של כולם ולהציע בקלות סט חדש של מועדים."
    },
    {
        question: "האם אני יכול לבטל את המנוי בכל עת?",
        answer: "כן, ניתן לבטל את המנוי בכל עת דרך עמוד 'מנויים'. המנוי יישאר פעיל עד סוף תקופת החיוב הנוכחית, ולא תחויב שוב."
    }
];

export default function ContactUsPage() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', feedback_type: 'general_feedback', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                setFormData(prev => ({ ...prev, name: currentUser.full_name, email: currentUser.email }));
            } catch (error) {
                // Not logged in
            }
        };
        loadUser();
    }, []);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.message || !formData.feedback_type) {
            alert("אנא מלא את כל השדות.");
            return;
        }
        setIsSubmitting(true);
        try {
            await Feedback.create(formData);
            setIsSuccess(true);
        } catch (error) {
            console.error("Failed to send feedback:", error);
            alert("שגיאה בשליחת המשוב. אנא נסה שוב.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <LifeBuoy className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                            צור קשר ומשוב
                        </h1>
                    </div>
                    <p className="text-xl text-slate-600">
                        אנחנו כאן כדי לעזור! יש לך שאלה, הצעה או דיווח על תקלה?
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <Card className="meetiz-card">
                        <CardHeader>
                            <CardTitle className="text-2xl">שלח לנו הודעה</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isSuccess ? (
                                <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">המשוב נשלח בהצלחה!</h3>
                                    <p className="text-slate-600 mb-6">תודה שעזרת לנו להשתפר. נחזור אליך בהקדם במידת הצורך.</p>
                                    <Button onClick={() => setIsSuccess(false)}>שלח משוב נוסף</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">שם מלא</Label>
                                            <Input id="name" value={formData.name} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">אימייל</Label>
                                            <Input id="email" type="email" value={formData.email} disabled />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="feedback_type">סוג הפנייה</Label>
                                        <Select value={formData.feedback_type} onValueChange={(value) => handleChange('feedback_type', value)}>
                                            <SelectTrigger id="feedback_type" className="rounded-xl">
                                                <SelectValue placeholder="בחר סוג פנייה" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="suggestion">הצעה לשיפור</SelectItem>
                                                <SelectItem value="bug_report">דיווח על תקלה</SelectItem>
                                                <SelectItem value="question">שאלה</SelectItem>
                                                <SelectItem value="general_feedback">משוב כללי</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">ההודעה שלך</Label>
                                        <Textarea id="message" value={formData.message} onChange={(e) => handleChange('message', e.target.value)} placeholder="כתוב כאן את הודעתך..." rows={6} className="rounded-xl" required />
                                    </div>
                                    <Button type="submit" disabled={isSubmitting} className="w-full meetiz-button-primary text-white rounded-xl py-3">
                                        {isSubmitting ? 'שולח...' : 'שלח הודעה'}
                                        <Send className="w-4 h-4 mr-2" />
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* FAQ and Contact Info */}
                    <div className="space-y-8">
                        <Card className="meetiz-card">
                            <CardHeader>
                                <CardTitle>שאלות נפוצות</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqItems.map((item, index) => (
                                        <AccordionItem key={index} value={`item-${index}`}>
                                            <AccordionTrigger>{item.question}</AccordionTrigger>
                                            <AccordionContent>{item.answer}</AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                        
                        <Card className="meetiz-card">
                            <CardHeader>
                                <CardTitle>דרכי התקשרות נוספות</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <a href="mailto:support@meetease.app" className="text-slate-700 hover:text-blue-600">support@meetease.app</a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-blue-600" />
                                    <span className="text-slate-700">050-1234567 (תמיכה טכנית)</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}