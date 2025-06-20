'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import Image from 'next/image';

type AnamnesisDisplayProps = {
  question: string;
  answer: boolean;
  details?: string;
};

const AnamnesisDisplay = ({ question, answer, details }: AnamnesisDisplayProps) => (
  <div className="space-y-2 rounded-lg border p-3 lg:p-4">
    <p className="font-medium text-sm lg:text-base">{question}</p>
    <div className="flex items-center gap-4">
      <span className={`font-semibold text-sm lg:text-base ${answer ? 'text-red-600' : 'text-green-600'}`}>
        {answer ? 'Yes' : 'No'}
      </span>
    </div>
    {answer && details && (
      <div className="pt-2 text-xs lg:text-sm text-gray-700">
        <p><span className="font-semibold">Details:</span> {details}</p>
      </div>
    )}
  </div>
);

type Appointment = {
  client_name: string;
  appointment_date: string;
};

type AnamnesisForm = {
  is_pregnant: boolean;
  has_consumed_alcohol_or_drugs: boolean;
  has_allergies: boolean;
  allergies_details?: string;
  has_been_tattooed_before: boolean;
  tattooed_area_details?: string;
  is_undergoing_heavy_treatment: boolean;
  is_allergic_to_iodine: boolean;
  has_history_of_infection: boolean;
  has_active_skin_disease: boolean;
  has_autoimmune_disease: boolean;
  has_immunodeficiency_disease: boolean;
  takes_anticoagulants_or_has_cardiovascular_issues: boolean;
  has_pacemaker: boolean;
  has_epilepsy: boolean;
  has_diabetes: boolean;
  has_herpes: boolean;
  has_asthma: boolean;
  has_conjunctivitis: boolean;
  is_on_accutane_treatment: boolean;
  has_taken_aspirin_or_anti_inflammatories: boolean;
  has_wound_healing_issues: boolean;
  place?: string;
  signature_date: string;
  client_signature?: string;
  practitioner_signature?: string;
};

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function AnamnesisViewPage({ params }: { params: { id: string }}) {
  const { id } = params;
  const supabase = createClient();
  const [formData, setFormData] = useState<AnamnesisForm | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select('client_name, appointment_date')
        .eq('id', id)
        .single();
      
      if (apptError) {
        setError('Failed to load appointment details.');
        setLoading(false);
        return;
      }
      setAppointment(apptData);

      const { data: formData, error: formError } = await supabase
        .from('anamnesis_forms')
        .select('*')
        .eq('appointment_id', id)
        .single();
      
      if (formError) {
        setError('Failed to load anamnesis form data. It may not exist for this appointment.');
      } else {
        setFormData(formData);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (error) {
     return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }

  if (!formData) {
    return <div className="flex h-screen items-center justify-center">No form data found for this appointment.</div>;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body > div > aside, body > header {
            display: none;
          }
          main {
             padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto p-2 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
          <h1 className="text-xl lg:text-2xl font-bold">Anamnesis Form</h1>
          <Button onClick={handlePrint} className="w-full sm:w-auto">Print / Save as PDF</Button>
        </div>
        <div className="printable-area">
          <Card>
            <CardHeader className="p-4 lg:p-6">
              <CardTitle className="text-lg lg:text-xl">Anamnesis & Consent Form</CardTitle>
              {appointment && (
                 <CardDescription className="text-sm lg:text-base">
                  For client: {appointment.client_name} <br/>
                  Appointment Date: {format(new Date(appointment.appointment_date), 'PPP p')}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                <div className="space-y-3 lg:space-y-4">
                  <AnamnesisDisplay question="1. Are you pregnant?" answer={formData.is_pregnant} />
                  <AnamnesisDisplay question="2. Have you consumed alcohol or drugs in the last 72 hours?" answer={formData.has_consumed_alcohol_or_drugs} />
                  <AnamnesisDisplay question="3. Do you have any allergies?" answer={formData.has_allergies} details={formData.allergies_details} />
                  <AnamnesisDisplay question="4. Have you been tattooed before?" answer={formData.has_been_tattooed_before} details={formData.tattooed_area_details} />
                  <AnamnesisDisplay question="5. Are you undergoing heavy treatments? (e.g. chemotherapy, cortisone…)" answer={formData.is_undergoing_heavy_treatment} />
                  <AnamnesisDisplay question="6. Are you allergic to iodine?" answer={formData.is_allergic_to_iodine} />
                  <AnamnesisDisplay question="7. Do you have a history of declared infection?" answer={formData.has_history_of_infection} />
                  <AnamnesisDisplay question="8. Do you suffer from an active skin disease? (vitiligo, psoriasis, eczema…)" answer={formData.has_active_skin_disease} />
                  <AnamnesisDisplay question="9. Do you suffer from an autoimmune disease? (e.g. multiple sclerosis)" answer={formData.has_autoimmune_disease} />
                  <AnamnesisDisplay question="10. Do you have an immunodeficiency disease? (HIV, cancer, etc.)" answer={formData.has_immunodeficiency_disease} />
                  <AnamnesisDisplay question="11. Do you take anticoagulants or have cardiovascular issues?" answer={formData.takes_anticoagulants_or_has_cardiovascular_issues} />
                  <AnamnesisDisplay question="12. Do you have a pacemaker?" answer={formData.has_pacemaker} />
                  <AnamnesisDisplay question="13. Do you suffer from epilepsy?" answer={formData.has_epilepsy} />
                  <AnamnesisDisplay question="14. Do you suffer from diabetes?" answer={formData.has_diabetes} />
                  <AnamnesisDisplay question="15. Do you suffer from herpes?" answer={formData.has_herpes} />
                  <AnamnesisDisplay question="16. Do you suffer from asthma?" answer={formData.has_asthma} />
                  <AnamnesisDisplay question="17. Do you suffer from conjunctivitis?" answer={formData.has_conjunctivitis} />
                  <AnamnesisDisplay question="18. Are you on Accutane treatment?" answer={formData.is_on_accutane_treatment} />
                  <AnamnesisDisplay question="19. Have you recently taken aspirin or anti-inflammatories?" answer={formData.has_taken_aspirin_or_anti_inflammatories} />
                  <AnamnesisDisplay question="20. Do you have wound healing issues?" answer={formData.has_wound_healing_issues} />
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-sm lg:text-base">Place of Signature</Label>
                  <p className="text-xs lg:text-sm text-gray-800">{formData.place || 'Not provided'}</p>
                </div>

                 <div className="space-y-2">
                  <Label className="text-sm lg:text-base">Date of Signature</Label>
                  <p className="text-xs lg:text-sm text-gray-800">{format(new Date(formData.signature_date), 'PPP')}</p>
                </div>

                <div className="space-y-4 lg:space-y-6 pt-4 lg:pt-6">
                   <div>
                      <Label className="text-sm lg:text-base">Client Signature (&quot;Read and approved&quot;)</Label>
                      <div className="mt-1 border rounded-md bg-gray-50">
                        {formData.client_signature && <Image src={formData.client_signature} alt="Client Signature" width={400} height={150} className="w-full h-auto" />}
                      </div>
                   </div>
                   <div>
                      <Label className="text-sm lg:text-base">Practitioner Signature (&quot;Read and approved&quot;)</Label>
                      <div className="mt-1 border rounded-md bg-gray-50">
                        {formData.practitioner_signature && <Image src={formData.practitioner_signature} alt="Practitioner Signature" width={400} height={150} className="w-full h-auto" />}
                      </div>
                   </div>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 