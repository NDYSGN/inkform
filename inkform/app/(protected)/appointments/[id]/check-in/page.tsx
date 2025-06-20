'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import SignatureCanvas from 'react-signature-canvas';

interface AnamnesisQuestionProps {
  question: string;
  value: string;
  onValueChange: (value: string) => void;
  details?: string;
  onDetailsChange?: (value: string) => void;
  detailsLabel?: string;
}

// Helper component for each question
const AnamnesisQuestion = ({ question, value, onValueChange, details, onDetailsChange, detailsLabel }: AnamnesisQuestionProps) => (
  <div className="space-y-3 rounded-lg border p-3 lg:p-4">
    <Label className="text-sm lg:text-base">{question}</Label>
    <RadioGroup
      required
      onValueChange={onValueChange}
      value={value}
      className="flex gap-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="no" id={question + '-no'} />
        <Label htmlFor={question + '-no'} className="text-sm">No</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="yes" id={question + '-yes'} />
        <Label htmlFor={question + '-yes'} className="text-sm">Yes</Label>
      </div>
    </RadioGroup>
    {value === 'yes' && details !== undefined && (
      <div className="pt-2">
        <Label htmlFor={question + '-details'} className="text-sm">{detailsLabel}</Label>
        <Input
          id={question + '-details'}
          value={details}
          onChange={(e) => onDetailsChange && onDetailsChange(e.target.value)}
          placeholder="Please specify..."
          className="mt-1"
        />
      </div>
    )}
  </div>
);


export default function CheckInPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const router = useRouter();
  const [appointment, setAppointment] = useState<{ client_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    is_pregnant: '',
    has_consumed_alcohol_or_drugs: '',
    has_allergies: '',
    allergies_details: '',
    has_been_tattooed_before: '',
    tattooed_area_details: '',
    is_undergoing_heavy_treatment: '',
    is_allergic_to_iodine: '',
    has_history_of_infection: '',
    has_active_skin_disease: '',
    has_autoimmune_disease: '',
    has_immunodeficiency_disease: '',
    takes_anticoagulants_or_has_cardiovascular_issues: '',
    has_pacemaker: '',
    has_epilepsy: '',
    has_diabetes: '',
    has_herpes: '',
    has_asthma: '',
    has_conjunctivitis: '',
    is_on_accutane_treatment: '',
    has_taken_aspirin_or_anti_inflammatories: '',
    has_wound_healing_issues: '',
    place: '',
  });

  const clientSigRef = useRef<SignatureCanvas>(null);
  const practitionerSigRef = useRef<SignatureCanvas>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAppointment() {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, studios (name)')
        .eq('id', id)
        .single();
      
      if (error) {
        setError('Failed to load appointment details.');
      } else {
        setAppointment(data);
      }
      setLoading(false);
    }
    fetchAppointment();
  }, [id, supabase]);

  const handleFormChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientSigRef.current?.isEmpty() || practitionerSigRef.current?.isEmpty()) {
      setError('Both client and practitioner signatures are required.');
      return;
    }
    
    setLoading(true);
    setError('');

    const formDataForDb = Object.entries(formState).reduce(
      (acc: Record<string, string | boolean | null>, [key, value]) => {
        if (value === 'yes' || value === 'no') {
          acc[key] = value === 'yes';
        } else {
          acc[key] = value || null;
        }
        return acc;
      },
      {} as Record<string, string | boolean | null>
    );
    
    const { error: insertError } = await supabase.from('anamnesis_forms').insert({
      appointment_id: id,
      ...formDataForDb,
      signature_date: new Date().toISOString(),
      client_signature: clientSigRef.current ? clientSigRef.current.toDataURL() : null,
      practitioner_signature: practitionerSigRef.current ? practitionerSigRef.current.toDataURL() : null,
    });

    if (insertError) {
      setError(`Failed to save form: ${insertError.message}`);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'Checked-in' })
      .eq('id', id);

    if (updateError) {
      setError(`Failed to update appointment status: ${updateError.message}`);
      setLoading(false);
    } else {
      router.push('/appointments');
    }
  };

  if (loading && !appointment) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-2 lg:p-8">
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="text-lg lg:text-xl">Anamnesis & Consent Form</CardTitle>
          <CardDescription className="text-sm lg:text-base">
            To be completed by the client before the tattoo session. Please answer honestly.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            <div className="space-y-3 lg:space-y-4">
              <AnamnesisQuestion question="1. Are you pregnant?" value={formState.is_pregnant} onValueChange={(val) => handleFormChange('is_pregnant', val)} />
              <AnamnesisQuestion question="2. Have you consumed alcohol or drugs in the last 72 hours?" value={formState.has_consumed_alcohol_or_drugs} onValueChange={(val) => handleFormChange('has_consumed_alcohol_or_drugs', val)} />
              <AnamnesisQuestion question="3. Do you have any allergies?" value={formState.has_allergies} onValueChange={(val) => handleFormChange('has_allergies', val)} details={formState.allergies_details} onDetailsChange={(val) => handleFormChange('allergies_details', val)} detailsLabel="If yes, which ones?" />
              <AnamnesisQuestion question="4. Have you been tattooed before?" value={formState.has_been_tattooed_before} onValueChange={(val) => handleFormChange('has_been_tattooed_before', val)} details={formState.tattooed_area_details} onDetailsChange={(val) => handleFormChange('tattooed_area_details', val)} detailsLabel="If yes, on which area?" />
              <AnamnesisQuestion question="5. Are you undergoing heavy treatments? (e.g. chemotherapy, cortisone…)" value={formState.is_undergoing_heavy_treatment} onValueChange={(val) => handleFormChange('is_undergoing_heavy_treatment', val)} />
              <AnamnesisQuestion question="6. Are you allergic to iodine?" value={formState.is_allergic_to_iodine} onValueChange={(val) => handleFormChange('is_allergic_to_iodine', val)} />
              <AnamnesisQuestion question="7. Do you have a history of declared infection?" value={formState.has_history_of_infection} onValueChange={(val) => handleFormChange('has_history_of_infection', val)} />
              <AnamnesisQuestion question="8. Do you suffer from an active skin disease? (vitiligo, psoriasis, eczema…)" value={formState.has_active_skin_disease} onValueChange={(val) => handleFormChange('has_active_skin_disease', val)} />
              <AnamnesisQuestion question="9. Do you suffer from an autoimmune disease? (e.g. multiple sclerosis)" value={formState.has_autoimmune_disease} onValueChange={(val) => handleFormChange('has_autoimmune_disease', val)} />
              <AnamnesisQuestion question="10. Do you have an immunodeficiency disease? (HIV, cancer, etc.)" value={formState.has_immunodeficiency_disease} onValueChange={(val) => handleFormChange('has_immunodeficiency_disease', val)} />
              <AnamnesisQuestion question="11. Do you take anticoagulants or have cardiovascular issues?" value={formState.takes_anticoagulants_or_has_cardiovascular_issues} onValueChange={(val) => handleFormChange('takes_anticoagulants_or_has_cardiovascular_issues', val)} />
              <AnamnesisQuestion question="12. Do you have a pacemaker?" value={formState.has_pacemaker} onValueChange={(val) => handleFormChange('has_pacemaker', val)} />
              <AnamnesisQuestion question="13. Do you suffer from epilepsy?" value={formState.has_epilepsy} onValueChange={(val) => handleFormChange('has_epilepsy', val)} />
              <AnamnesisQuestion question="14. Do you suffer from diabetes?" value={formState.has_diabetes} onValueChange={(val) => handleFormChange('has_diabetes', val)} />
              <AnamnesisQuestion question="15. Do you suffer from herpes?" value={formState.has_herpes} onValueChange={(val) => handleFormChange('has_herpes', val)} />
              <AnamnesisQuestion question="16. Do you suffer from asthma?" value={formState.has_asthma} onValueChange={(val) => handleFormChange('has_asthma', val)} />
              <AnamnesisQuestion question="17. Do you suffer from conjunctivitis?" value={formState.has_conjunctivitis} onValueChange={(val) => handleFormChange('has_conjunctivitis', val)} />
              <AnamnesisQuestion question="18. Are you on Accutane treatment?" value={formState.is_on_accutane_treatment} onValueChange={(val) => handleFormChange('is_on_accutane_treatment', val)} />
              <AnamnesisQuestion question="19. Have you recently taken aspirin or anti-inflammatories?" value={formState.has_taken_aspirin_or_anti_inflammatories} onValueChange={(val) => handleFormChange('has_taken_aspirin_or_anti_inflammatories', val)} />
              <AnamnesisQuestion question="20. Do you have wound healing issues?" value={formState.has_wound_healing_issues} onValueChange={(val) => handleFormChange('has_wound_healing_issues', val)} />
            </div>

            <div className="space-y-4 lg:space-y-6 pt-4 lg:pt-6">
               <div>
                  <Label className="text-sm lg:text-base">Client Signature (&quot;Read and approved&quot;)</Label>
                  <div className="mt-1 border rounded-md">
                    <SignatureCanvas ref={clientSigRef} canvasProps={{ className: 'w-full h-24 lg:h-32' }} />
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => clientSigRef.current?.clear()}>Clear</Button>
               </div>
               <div>
                  <Label className="text-sm lg:text-base">Practitioner Signature (&quot;Read and approved&quot;)</Label>
                  <div className="mt-1 border rounded-md">
                    <SignatureCanvas ref={practitionerSigRef} canvasProps={{ className: 'w-full h-24 lg:h-32' }} />
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => practitionerSigRef.current?.clear()}>Clear</Button>
               </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="place" className="text-sm lg:text-base">Place</Label>
                <Input id="place" value={formState.place} onChange={(e) => handleFormChange('place', e.target.value)} placeholder="City name" required />
            </div>


            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="w-full lg:w-auto">
                {loading ? 'Submitting...' : 'Submit & Complete Check-in'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 