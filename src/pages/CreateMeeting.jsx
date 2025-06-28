
import React, { useState, useEffect } from "react";
import { User, Meeting } from "@/api/entities"; // Corrected import order
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
// The SendEmail integration is no longer needed for automatic email sending
// import { SendEmail } from "@/api/integrations"; 

import MeetingBasicInfo from "../components/create/MeetingBasicInfo";
import MeetingDates from "../components/create/MeetingDates";
import MeetingParticipants from "../components/create/MeetingParticipants";
import MeetingReview from "../components/create/MeetingReview";
import MeetingSuccess from "../components/create/MeetingSuccess";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Added currentUser state
  const [meetingData, setMeetingData] = useState({
    title: "",
    description: "",
    location: "",
    duration_minutes: 60,
    modality: "online", // Added modality
    travel_time_minutes: 0, // Added travel_time_minutes
    attachments: [], // הוספנו את שדה הקבצים המצורפים
    proposed_dates: [],
    participants: []
  });

  // בדיקה אם זה שכפול ישיבה או מבדיקת זמינות
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isDuplicate = urlParams.get('duplicate') === 'true';
    const fromAvailability = urlParams.get('from') === 'availability';

    if (isDuplicate) {
      const duplicatedData = localStorage.getItem('duplicatedMeetingData');
      if (duplicatedData) {
        try {
          const parsedData = JSON.parse(duplicatedData);
          // Only take relevant fields for a new meeting
          setMeetingData({
            title: parsedData.title || "",
            description: parsedData.description || "",
            location: parsedData.location || "",
            duration_minutes: parsedData.duration_minutes || 60,
            modality: parsedData.modality || "online", // Copy modality
            travel_time_minutes: parsedData.travel_time_minutes || 0, // Copy travel_time_minutes
            attachments: parsedData.attachments || [], // Copy attachments
            proposed_dates: [], // Clear proposed dates as they are specific to previous meeting
            participants: parsedData.participants || []
          });
          localStorage.removeItem('duplicatedMeetingData'); // ניקוי אחרי שימוש
        } catch (error) {
          console.error('Error parsing duplicated meeting data:', error);
        }
      }
    } else if (fromAvailability) {
      const prefilledData = localStorage.getItem('prefilledMeetingData');
      if (prefilledData) {
        try {
          const parsedData = JSON.parse(prefilledData);
          setMeetingData(prev => ({
            ...prev,
            ...parsedData
          }));
          setCurrentStep(2); // דלג ישר למסך המשתתפים
          localStorage.removeItem('prefilledMeetingData'); // ניקוי אחרי שימוש
        } catch (error) {
          console.error('Error parsing prefilled meeting data:', error);
        }
      }
    }
  }, []);

  // Load current user details
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
        // Optionally, handle error state or redirect if user cannot be loaded
      }
    };
    loadUser();
  }, []);

  const steps = [
    { number: 1, title: "פרטי בסיס", component: MeetingBasicInfo },
    { number: 2, title: "משתתפים", component: MeetingParticipants },
    { number: 3, title: "בחירת מועדים", component: MeetingDates },
    { number: 4, title: "סיכום ושליחה", component: MeetingReview }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  function validateCurrentStep() {
    switch (currentStep) {
      case 1:
        return meetingData.title && meetingData.duration_minutes;
      case 2:
        return meetingData.participants.length > 0;
      case 3:
        return meetingData.proposed_dates.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }

  const handleSubmit = async () => {
    if (!currentUser?.organization_id) {
      console.error("No organization_id found for user. Cannot create meeting.");
      alert("שגיאה: לא ניתן ליצור ישיבה ללא פרטי ארגון. אנא נסה לרענן את העמוד.");
      return;
    }

    setIsCreating(true);
    try {
      const invitationCode = Math.random().toString(36).substring(2, 15);
      
      console.log("Creating meeting with participants:", meetingData.participants);
      
      // יצירת הישיבה
      const meeting = await Meeting.create({
        ...meetingData,
        organization_id: currentUser.organization_id,
        status: "sent",
        invitation_code: invitationCode
      });
      
      // יצירת קישורי הזמנה עבור כל משתתף
      const invitationLinks = meetingData.participants.map(participant => ({
        name: participant.name,
        email: participant.email,
        link: `${window.location.origin}${createPageUrl("RespondToMeeting")}?meeting=${meeting.id}&code=${meeting.invitation_code}&email=${encodeURIComponent(participant.email)}`
      }));
      
      // שמירת הקישורים למסך ההצלחה
      setCreatedMeeting({
        ...meeting,
        invitationLinks: invitationLinks
      });
      
      console.log("Meeting created successfully:", meeting.id);
      console.log("Invitation links generated:", invitationLinks);

      // הצגת הודעת הצלחה עם פרטי השיתוף
      alert(`הישיבה נוצרה בהצלחה!\n\nלא ניתן לשלוח מיילים אוטומטית למשתתפים חיצוניים.\nתוכל לשתף איתם את קישורי ההזמנה ישירות במסך הבא.`);
      
      setIsSuccess(true);
      
      // העברה לדף הבית אחרי 10 שניות (יותר זמן לראות את הקישורים)
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 10000);
      
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert('שגיאה ביצירת הישיבה. אנא נסה שוב.');
    } finally {
      setIsCreating(false);
    }
  };

  // The sendInvitationEmail function is removed as emails are no longer sent automatically.

  const CurrentStepComponent = steps[currentStep - 1].component;
  const canProceed = validateCurrentStep();

  if (isSuccess) {
    return <MeetingSuccess meeting={createdMeeting} />;
  }

  // Prevent rendering the main form if currentUser or organization_id is not yet loaded
  if (!currentUser?.organization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-4">טוען...</h2>
          <p className="text-slate-600">אנא המתן בזמן טעינת פרטי המשתמש</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="rounded-full"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {new URLSearchParams(window.location.search).get('duplicate') === 'true' ? 
                'שכפול ישיבה' : 'יצירת ישיבה חדשה'}
            </h1>
            {new URLSearchParams(window.location.search).get('duplicate') === 'true' && (
              <p className="text-slate-600 mt-1">
                🔄 ישיבה חדשה על בסיס ישיבה קיימת - ניתן לערוך את כל הפרטים
              </p>
            )}
            {new URLSearchParams(window.location.search).get('from') === 'availability' && (
              <p className="text-slate-600 mt-1">
                📅 יצירת ישיבה מבדיקת זמינות - המשך עם פרטי המשתתפים.
              </p>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="flex justify-between items-center mb-10 px-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center text-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                  currentStep > step.number 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.number
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStep > step.number ? <Check /> : step.number}
                </div>
                <p className={`mt-2 text-xs md:text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-blue-600' : 'text-slate-500'}`}>{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 md:mx-4 rounded-full transition-colors duration-500 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="meetiz-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8">
           <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent 
                data={meetingData}
                onChange={setMeetingData}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="rounded-xl px-6 py-3"
          >
            חזור
          </Button>
          
          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="meetiz-button-primary text-white rounded-xl px-6 py-3"
            >
              המשך
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isCreating}
              className="meetiz-button-primary text-white rounded-xl px-6 py-3"
            >
              {isCreating ? "יוצר ישיבה..." : "שלח הזמנות"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
