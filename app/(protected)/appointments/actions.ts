'use server';

import { createClient } from '@/lib/supabase/server';
import { GoogleCalendarService, createAppointmentEvent } from '@/lib/calendar';
import { EmailService } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export async function createAppointmentAction(formData: {
  clientName: string;
  clientEmail?: string;
  appointmentDate: Date;
  description: string;
  price?: number;
  deposit?: number;
  depositPaid: boolean;
  addToCalendar: boolean;
  sendEmail: boolean;
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data: studio, error: studioError } = await supabase
    .from('studios')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (studioError || !studio) {
    return { success: false, error: 'Could not find your studio settings.' };
  }
  
  // 1. Insert the appointment into the database
  const { data: newAppointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      studio_id: studio.id,
      client_name: formData.clientName,
      client_email: formData.clientEmail || null,
      appointment_date: formData.appointmentDate.toISOString(),
      description: formData.description,
      price: formData.price,
      deposit: formData.deposit,
      deposit_paid: formData.depositPaid,
      payment_status: formData.depositPaid ? 'deposit_paid' : 'pending',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert Error:', insertError);
    return { success: false, error: 'Failed to create appointment in database.' };
  }

  let calendarEventId = null;

  // 2. Add to Google Calendar if enabled
  if (formData.addToCalendar && studio.calendar_integration_enabled && studio.google_calendar_credentials) {
    try {
      const calendarService = new GoogleCalendarService(JSON.parse(studio.google_calendar_credentials));
      const event = createAppointmentEvent(
        formData.clientName,
        formData.appointmentDate,
        formData.description,
        formData.price,
        formData.deposit
      );
      const createdEvent = await calendarService.createEvent(event);
      calendarEventId = createdEvent.id;
    } catch (e) {
      console.error("Calendar Error:", e);
      // Don't block, just log the error for now
    }
  }

  // 3. Send confirmation email if enabled
  console.log('Checking conditions for sending email...');
  console.log(`- Send Email Toggle: ${formData.sendEmail}`);
  console.log(`- Client Email Provided: ${!!formData.clientEmail}`);
  console.log(`- Studio Notifications Enabled: ${studio.email_notifications_enabled}`);

  if (formData.sendEmail && formData.clientEmail && studio.email_notifications_enabled) {
    console.log('All conditions met. Attempting to send email...');
    try {
        const emailService = new EmailService({
            host: studio.email_smtp_host,
            port: studio.email_smtp_port,
            secure: (studio.email_smtp_port === 465),
            auth: {
                user: studio.email_smtp_user,
                pass: studio.email_smtp_pass,
            },
        });

        const emailResult = await emailService.sendAppointmentConfirmation({
            clientName: formData.clientName,
            clientEmail: formData.clientEmail,
            appointmentDate: formData.appointmentDate,
            description: formData.description,
            price: formData.price,
            deposit: formData.deposit,
            studioName: studio.name,
            studioAddress: studio.address,
            studioPhone: studio.phone,
        });
        console.log('Email sent successfully. Nodemailer response:', emailResult);
    } catch(e) {
        console.error("Email Error:", e);
        // Don't block, just log the error for now
    }
  } else {
    console.log('One or more conditions for sending email were not met.');
  }

  // 4. Update appointment with calendar event ID if it was created
  if (calendarEventId) {
    await supabase
      .from('appointments')
      .update({ calendar_event_id: calendarEventId })
      .eq('id', newAppointment.id);
  }

  revalidatePath('/appointments');
  return { success: true, appointmentId: newAppointment.id };
}

export async function markAppointmentAsPaid(appointmentId: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('appointments')
    .update({ payment_status: 'fully_paid' })
    .eq('id', appointmentId);

  if (error) {
    console.error('Update Error:', error);
    return { success: false, error: 'Failed to update appointment status.' };
  }

  revalidatePath('/appointments');
  revalidatePath('/finance');
  return { success: true };
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', payment_status: 'cancelled' })
    .eq('id', appointmentId);

  if (error) {
    console.error('Cancel Error:', error);
    return { success: false, error: 'Failed to cancel appointment.' };
  }

  revalidatePath('/appointments');
  revalidatePath('/finance');
  return { success: true };
} 