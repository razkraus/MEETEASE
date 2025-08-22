import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import CreateMeeting from "./CreateMeeting";

import MyMeetings from "./MyMeetings";

import RespondToMeeting from "./RespondToMeeting";

import Customers from "./Customers";

import Settings from "./Settings";

import Contacts from "./Contacts";

import Subscription from "./Subscription";

import MeetingDetails from "./MeetingDetails";

import OrganizationMembers from "./OrganizationMembers";

import MeetingHistory from "./MeetingHistory";

import Home from "./Home";

import CheckAvailability from "./CheckAvailability";

import ContactUs from "./ContactUs";

import OfficeBranding from "./OfficeBranding";

import OfficePayment from "./OfficePayment";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CreateMeeting: CreateMeeting,
    
    MyMeetings: MyMeetings,
    
    RespondToMeeting: RespondToMeeting,
    
    Customers: Customers,
    
    Settings: Settings,
    
    Contacts: Contacts,
    
    Subscription: Subscription,
    
    MeetingDetails: MeetingDetails,
    
    OrganizationMembers: OrganizationMembers,
    
    MeetingHistory: MeetingHistory,
    
    Home: Home,

    CheckAvailability: CheckAvailability,

    ContactUs: ContactUs,

    OfficeBranding: OfficeBranding,

    OfficePayment: OfficePayment,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/CreateMeeting" element={<CreateMeeting />} />
                
                <Route path="/MyMeetings" element={<MyMeetings />} />
                
                <Route path="/RespondToMeeting" element={<RespondToMeeting />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Contacts" element={<Contacts />} />
                
                <Route path="/Subscription" element={<Subscription />} />
                
                <Route path="/MeetingDetails" element={<MeetingDetails />} />
                
                <Route path="/OrganizationMembers" element={<OrganizationMembers />} />
                
                <Route path="/MeetingHistory" element={<MeetingHistory />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/CheckAvailability" element={<CheckAvailability />} />

                <Route path="/ContactUs" element={<ContactUs />} />

                <Route path="/OfficeBranding" element={<OfficeBranding />} />
                <Route path="/OfficePayment" element={<OfficePayment />} />

                </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}