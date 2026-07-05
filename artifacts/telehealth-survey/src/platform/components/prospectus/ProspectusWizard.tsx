import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ProspectusSectionFields } from '@/platform/components/prospectus/ProspectusFormFields';
import {
  deleteProspectusAttachment,
  fetchProspectusAttachments,
  patchProspectus,
  submitProspectus,
  uploadProspectusAttachment,
} from '@/platform/lib/prospectus-api';
import { formValuesToPatch, prospectusToFormValues } from '@/platform/lib/prospectus-form';
import { prospectusPaths } from '@/platform/paths';
import { ProspectusAttachmentUpload } from '@/platform/components/prospectus/ProspectusAttachmentUpload';
import type { ProspectusAttachment, ProspectusFormValues, ProspectusPublic } from '@/platform/lib/types';
import { PROSPECTUS_SECTIONS } from '@/platform/lib/types';

type Props = {
  initialData: ProspectusPublic;
  onSubmitted: (data: ProspectusPublic) => void;
};

export function ProspectusWizard({ initialData, onSubmitted }: Props) {
  const [step, setStep] = useState(0);
  const [formValues, setFormValues] = useState<ProspectusFormValues>(() =>
    prospectusToFormValues(initialData),
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [attachments, setAttachments] = useState<ProspectusAttachment[]>(
    initialData.attachments ?? [],
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const refreshAttachments = useCallback(async () => {
    const res = await fetchProspectusAttachments(initialData.publicId);
    setAttachments(res.attachments ?? []);
  }, [initialData.publicId]);

  useEffect(() => {
    void refreshAttachments();
  }, [refreshAttachments]);

  const saveDraft = useCallback(
    async (values: ProspectusFormValues) => {
      setSaveState('saving');
      try {
        const updated = await patchProspectus(initialData.publicId, formValuesToPatch(values));
        setSaveState('saved');
        queryClient.setQueryData(['prospectus', initialData.publicId], updated);
        return updated;
      } catch (err) {
        setSaveState('error');
        const message = err instanceof Error ? err.message : 'Save failed';
        toast({ title: 'Save failed', description: message, variant: 'destructive' });
        throw err;
      }
    },
    [initialData.publicId, queryClient, toast],
  );

  const handleFormChange = useCallback((values: ProspectusFormValues) => {
    setFormValues(values);
    setSaveState('idle');
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => saveDraft(formValues),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await saveDraft(formValues);
      return submitProspectus(initialData.publicId);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['prospectus', initialData.publicId], updated);
      onSubmitted(updated);
      toast({
        title: 'Prospectus submitted',
        description: 'Research leadership will review your submission.',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProspectusAttachment(initialData.publicId, file),
    onSuccess: () => void refreshAttachments(),
    onError: (err: Error) => {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProspectusAttachment(initialData.publicId, id),
    onSuccess: () => void refreshAttachments(),
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    },
  });

  function handleNext() {
    setStep((s) => Math.min(s + 1, PROSPECTUS_SECTIONS.length - 1));
  }

  async function handleSaveDraft() {
    try {
      await saveMutation.mutateAsync();
      toast({
        title: 'Draft saved',
        description: 'Your progress is saved. Continue editing or return later with your tracking link.',
      });
    } catch {
      // toast already shown
    }
  }

  async function handleSaveAndExit() {
    try {
      await saveMutation.mutateAsync();
      toast({
        title: 'Draft saved',
        description: 'You can return anytime using your tracking link.',
      });
      navigate(prospectusPaths.landing);
    } catch {
      // toast already shown
    }
  }

  const totalSteps = PROSPECTUS_SECTIONS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isLastStep = step === totalSteps - 1;
  const isSavingDraft = saveMutation.isPending;
  const isSubmitting = submitMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Section {step + 1} of {totalSteps}: {PROSPECTUS_SECTIONS[step]}
          </span>
          <span className="text-muted-foreground">
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && 'Draft saved'}
            {saveState === 'error' && 'Save error'}
            {saveState === 'idle' && 'Navigate freely — save when you pause or submit'}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-lg border bg-card p-6">
        {step < totalSteps - 1 ? (
          <ProspectusSectionFields
            step={step}
            values={formValues}
            onChange={handleFormChange}
            submitterName={initialData.submitterName}
            submitterEmail={initialData.submitterEmail}
          />
        ) : (
          <AttachmentsStep
            attachments={attachments}
            uploading={uploadMutation.isPending}
            onUpload={(file) => uploadMutation.mutate(file)}
            onDelete={(id) => deleteMutation.mutate(id)}
            onSubmit={() => submitMutation.mutate()}
            submitting={submitMutation.isPending}
          />
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || isSubmitting}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSavingDraft || isSubmitting}
            onClick={() => void handleSaveDraft()}
          >
            {isSavingDraft ? 'Saving…' : 'Save draft'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="border border-primary/20 bg-primary/5 font-medium shadow-sm hover:bg-primary/10"
            disabled={isSavingDraft || isSubmitting}
            onClick={() => void handleSaveAndExit()}
          >
            {isSavingDraft ? 'Saving…' : 'Save & exit'}
          </Button>
          {!isLastStep && (
            <Button type="button" disabled={isSubmitting} onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentsStep({
  attachments,
  uploading,
  onUpload,
  onDelete,
  onSubmit,
  submitting,
}: {
  attachments: ProspectusAttachment[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: number) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <ProspectusAttachmentUpload
        attachments={attachments}
        uploading={uploading}
        onUpload={onUpload}
        onDelete={onDelete}
      />

      <div className="border-t pt-4 space-y-2">
        <h3 className="font-medium">Ready to submit?</h3>
        <p className="text-sm text-muted-foreground">
          Submitting saves your latest answers and sends the prospectus for dual review (research
          leadership + platform operations).
        </p>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Save & submit for review'}
        </Button>
      </div>
    </div>
  );
}
