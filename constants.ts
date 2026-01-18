import { Status, EmailTemplate, WhatsAppTemplate } from './types';

export const DEFAULT_STATUSES: Status[] = [
  { id: 'new_lead', label: 'New Lead', slug: 'new_lead', color: '#3B82F6', order: 1, requires_payment: false, requires_rejection_reason: false },
  { id: 'eligible', label: 'Eligible', slug: 'eligible', color: '#10B981', order: 2, requires_payment: false, requires_rejection_reason: false },
  { id: 'non_eligible', label: 'Non Eligible', slug: 'non_eligible', color: '#6B7280', order: 3, requires_payment: false, requires_rejection_reason: false },
  { id: 'interview_scheduled', label: 'Interview Scheduled', slug: 'interview_scheduled', color: '#F59E0B', order: 4, requires_payment: false, requires_rejection_reason: false },
  { id: 'follow_ups', label: 'Follow-ups', slug: 'follow_ups', color: '#8B5CF6', order: 5, requires_payment: false, requires_rejection_reason: false },
  { id: 'selected', label: 'Selected', slug: 'selected', color: '#06B6D4', order: 6, requires_payment: false, requires_rejection_reason: false },
  { id: 'rejected', label: 'Rejected', slug: 'rejected', color: '#EF4444', order: 7, requires_payment: false, requires_rejection_reason: true },
  { id: 'not_interested', label: 'Not Interested', slug: 'not_interested', color: '#9CA3AF', order: 8, requires_payment: false, requires_rejection_reason: false },
  { id: 'enrolled', label: 'Enrolled', slug: 'enrolled', color: '#7C3AED', order: 9, requires_payment: true, requires_rejection_reason: false },
];

export const SUPERADMIN_EMAIL = 'rohanmishra.design@gmail.com';

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'tpl_welcome',
        name: 'Welcome Email',
        status_trigger: 'new_lead',
        subject: 'Welcome to Mastry!',
        body: `Hi {{first_name}},\n\nThanks for your interest in our cohort. We will be in touch shortly to discuss the next steps.\n\nCheers,\nRohan`,
        is_active: true
    },
    {
        id: 'tpl_eligible',
        name: 'Eligibility Confirmed',
        status_trigger: 'eligible',
        subject: 'You are Eligible! Next Steps inside.',
        body: `Hi {{first_name}},\n\nWe reviewed your profile and we're happy to inform you that you are eligible for the cohort. Let's schedule a chat.\n\nBest,\nTeam Mastry`,
        is_active: true
    },
    {
        id: 'tpl_non_eligible',
        name: 'Not Eligible',
        status_trigger: 'non_eligible',
        subject: 'Update on your application',
        body: `Hi {{first_name}},\n\nThank you for your interest. Unfortunately, based on the criteria, we cannot proceed with your application at this time.\n\nRegards,\nTeam Mastry`,
        is_active: true
    },
    {
        id: 'tpl_interview',
        name: 'Interview Invitation',
        status_trigger: 'interview_scheduled',
        subject: 'Your Interview is Scheduled, {{first_name}}!',
        body: `Hi {{first_name}},\n\nGreat news! Your interview for the UI/UX Design Cohort has been scheduled. Please check your calendar invites.\n\nBest regards,\nMastry Team`,
        is_active: true
    },
    {
        id: 'tpl_follow_up',
        name: 'Follow Up',
        status_trigger: 'follow_ups',
        subject: 'Checking in',
        body: `Hi {{first_name}},\n\nJust checking in to see if you have any questions regarding the cohort.\n\nBest,\n{{assigned_to_name}}`,
        is_active: true
    },
    {
        id: 'tpl_selected',
        name: 'Selection Notice',
        status_trigger: 'selected',
        subject: 'Congratulations! You are selected.',
        body: `Hi {{first_name}},\n\nWe are thrilled to offer you a spot in the upcoming cohort! Please complete the enrollment formalities soon.\n\nCheers,\nRohan`,
        is_active: true
    },
    {
        id: 'tpl_rejected',
        name: 'Rejection Notice',
        status_trigger: 'rejected',
        subject: 'Application Update',
        body: `Hi {{first_name}},\n\nThank you for taking the time to interview with us. However, we have decided not to move forward with your application for this cohort.\n\nBest,\nTeam Mastry`,
        is_active: true
    },
    {
        id: 'tpl_payment_link',
        name: 'Payment Link',
        status_trigger: 'payment_link',
        subject: 'Complete your Enrollment',
        body: `Hi {{first_name}},\n\nCongratulations on being selected! Here is your payment link to secure your spot:\n\n{{payment_link}}\n\nWelcome aboard!\nTeam Mastry`,
        is_active: true
    },
    {
        id: 'tpl_enrolled',
        name: 'Enrollment Success',
        status_trigger: 'enrolled',
        subject: 'Welcome to the Cohort!',
        body: `Hi {{first_name}},\n\nYour enrollment is confirmed. We are excited to start this journey with you.\n\nSee you soon,\nRohan`,
        is_active: true
    }
];

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
    {
        id: 'wa_welcome',
        name: 'Welcome Message',
        status_trigger: 'new_lead',
        template_id: 'welcome_v1',
        template_preview: `Hi {{first_name}}! Thanks for applying to Mastry. We'll review your profile soon.`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_eligible',
        name: 'Eligibility Confirmed',
        status_trigger: 'eligible',
        template_id: 'eligible_v1',
        template_preview: `Hi {{first_name}}, good news! You are eligible for the cohort. Let's chat soon.`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_non_eligible',
        name: 'Not Eligible',
        status_trigger: 'non_eligible',
        template_id: 'non_eligible_v1',
        template_preview: `Hi {{first_name}}, thank you for applying. Unfortunately, you're not eligible at this time.`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_interview',
        name: 'Interview Reminder',
        status_trigger: 'interview_scheduled',
        template_id: 'interview_reminder_v2',
        template_preview: `Hi {{first_name}}! 👋\nYour interview for UI/UX Design Cohort is scheduled. Check your email for details.`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_follow_up',
        name: 'Follow Up',
        status_trigger: 'follow_ups',
        template_id: 'follow_up_v1',
        template_preview: `Hi {{first_name}}, just checking if you have any questions?`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_selected',
        name: 'Selection Alert',
        status_trigger: 'selected',
        template_id: 'selected_v1',
        template_preview: `Congrats {{first_name}}! 🌟 You've been selected for the cohort. Check your email for the offer.`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_rejected',
        name: 'Rejection Notice',
        status_trigger: 'rejected',
        template_id: 'rejected_v1',
        template_preview: `Hi {{first_name}}, we've decided not to move forward with your application this time. Best of luck.`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_payment',
        name: 'Send Payment Link',
        status_trigger: 'payment_link',
        template_id: 'payment_link_v1',
        template_preview: `Hi {{first_name}}, secure your spot now! click here: {{payment_link}}`,
        variable_mapping: {},
        is_active: true
    },
    {
        id: 'wa_enrolled',
        name: 'Enrollment Success',
        status_trigger: 'enrolled',
        template_id: 'enrolled_v1',
        template_preview: `Welcome aboard {{first_name}}! 🚀 Your enrollment is confirmed.`,
        variable_mapping: {},
        is_active: true
    }
];