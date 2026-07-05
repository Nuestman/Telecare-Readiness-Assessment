import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetClinicianStudyCollectionStatus,
  useSubmitClinicianSurvey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { clinicianStudyConfig as cfg } from "@/studies/clinician-telehealth-readiness/config";
import { studyPaths } from "@/studies/clinician-telehealth-readiness/paths";
import {
  CardRadioGroup,
  MultiSelectGroup,
  LikertScale,
  toApiMultiSelect,
} from "@/studies/clinician-telehealth-readiness/components/SurveyFormWidgets";

const likertRequired = z.string().min(1, "This field is required");

const formSchema = z.object({
  consent_given: z
    .boolean()
    .refine((val) => val === true, "You must provide consent to submit"),
  clinical_role: z.string().min(1, "This field is required"),
  clinical_role_other: z.string().optional(),
  department: z.string().min(1, "This field is required"),
  department_other: z.string().optional(),
  years_in_clinical_practice: z.string().min(1, "This field is required"),
  years_at_aga_health: z.string().min(1, "This field is required"),
  telehealth_exposure_in_role: z.string().min(1, "This field is required"),
  heard_of_telehealth: z.string().min(1, "This field is required"),
  awareness_sources: z.array(z.string()).default([]),
  awareness_sources_other: z.string().optional(),
  used_telehealth_before: z.string().min(1, "This field is required"),
  used_modalities: z.array(z.string()).default([]),
  national_policy_awareness: z.string().min(1, "This field is required"),
  confidence_video_consultation: likertRequired,
  confidence_phone_followup: likertRequired,
  confidence_async_messaging: likertRequired,
  confidence_remote_vitals: likertRequired,
  confidence_digital_documentation: likertRequired,
  time_for_telehealth: likertRequired,
  documentation_burden_concern: likertRequired,
  workflow_integration: z.string().min(1, "This field is required"),
  referral_pathway_clarity: likertRequired,
  team_coordination: z.string().min(1, "This field is required"),
  comfort_clinical_decisions_remotely: z.string().optional(),
  comfort_patient_education_remotely: z.string().optional(),
  internet_at_workplace: z.string().min(1, "This field is required"),
  power_reliability: z.string().min(1, "This field is required"),
  device_availability: z.string().min(1, "This field is required"),
  private_space_for_calls: z.string().min(1, "This field is required"),
  facility_support: likertRequired,
  barrier_liability: likertRequired,
  barrier_privacy: likertRequired,
  barrier_patient_digital_literacy: likertRequired,
  barrier_language: likertRequired,
  barrier_technical_failure: likertRequired,
  barrier_effectiveness: likertRequired,
  other_barriers: z.array(z.string()).default([]),
  other_barriers_text: z.string().optional(),
  received_telehealth_training: z.string().min(1, "This field is required"),
  training_needs: z.array(z.string()).default([]),
  training_format_preference: z.string().min(1, "This field is required"),
  willing_to_provide_telehealth: likertRequired,
  willing_ncd_telecare: z.string().min(1, "This field is required"),
  willing_routine_review: z.string().min(1, "This field is required"),
  willing_triage: z.string().min(1, "This field is required"),
  preferred_modalities: z.array(z.string()).default([]),
  willing_prescribe_after_remote: z.string().optional(),
  willing_remote_monitoring: z.string().optional(),
  suggestions: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  consent_given: false,
  clinical_role: "",
  clinical_role_other: "",
  department: "",
  department_other: "",
  years_in_clinical_practice: "",
  years_at_aga_health: "",
  telehealth_exposure_in_role: "",
  heard_of_telehealth: "",
  awareness_sources: [],
  awareness_sources_other: "",
  used_telehealth_before: "",
  used_modalities: [],
  national_policy_awareness: "",
  confidence_video_consultation: "",
  confidence_phone_followup: "",
  confidence_async_messaging: "",
  confidence_remote_vitals: "",
  confidence_digital_documentation: "",
  time_for_telehealth: "",
  documentation_burden_concern: "",
  workflow_integration: "",
  referral_pathway_clarity: "",
  team_coordination: "",
  comfort_clinical_decisions_remotely: "",
  comfort_patient_education_remotely: "",
  internet_at_workplace: "",
  power_reliability: "",
  device_availability: "",
  private_space_for_calls: "",
  facility_support: "",
  barrier_liability: "",
  barrier_privacy: "",
  barrier_patient_digital_literacy: "",
  barrier_language: "",
  barrier_technical_failure: "",
  barrier_effectiveness: "",
  other_barriers: [],
  other_barriers_text: "",
  received_telehealth_training: "",
  training_needs: [],
  training_format_preference: "",
  willing_to_provide_telehealth: "",
  willing_ncd_telecare: "",
  willing_routine_review: "",
  willing_triage: "",
  preferred_modalities: [],
  willing_prescribe_after_remote: "",
  willing_remote_monitoring: "",
  suggestions: "",
};

const SECTIONS = [
  "Welcome",
  "Professional Profile",
  "Awareness & Prior Use",
  "Self-efficacy",
  "Workflow Fit",
  "Facility Enablers",
  "Barriers & Concerns",
  "Training Needs",
  "Willingness to Deliver",
  "Open Feedback",
];

const AGREE_SCALE = [
  { label: "Strongly disagree", value: "strongly_disagree" },
  { label: "Disagree", value: "disagree" },
  { label: "Neutral", value: "neutral" },
  { label: "Agree", value: "agree" },
  { label: "Strongly agree", value: "strongly_agree" },
];

const YES_MAYBE_NO = [
  { label: "Yes", value: "yes" },
  { label: "Maybe", value: "maybe" },
  { label: "No", value: "no" },
];

function isMedicalOfficer(role: string) {
  return role === "medical_officer";
}

function isNurseMidwife(role: string) {
  return role === "nurse_midwife";
}

export default function SurveyPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const formStartedAt = useRef(new Date().toISOString());
  const { data: collectionStatus } = useGetClinicianStudyCollectionStatus();
  const surveyOpen = collectionStatus?.is_open !== false;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { watch, control, trigger, getValues } = form;
  const values = watch();
  const submitSurvey = useSubmitClinicianSurvey();

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];

    if (step === 0) {
      fieldsToValidate = ["consent_given"];
    } else if (step === 1) {
      fieldsToValidate = [
        "clinical_role",
        "department",
        "years_in_clinical_practice",
        "years_at_aga_health",
        "telehealth_exposure_in_role",
      ];
      if (values.clinical_role === "other_clinical") {
        fieldsToValidate.push("clinical_role_other");
      }
      if (values.department === "other") {
        fieldsToValidate.push("department_other");
      }
    } else if (step === 2) {
      fieldsToValidate = [
        "heard_of_telehealth",
        "used_telehealth_before",
        "national_policy_awareness",
      ];
    } else if (step === 3) {
      fieldsToValidate = [
        "confidence_video_consultation",
        "confidence_phone_followup",
        "confidence_async_messaging",
        "confidence_remote_vitals",
        "confidence_digital_documentation",
      ];
    } else if (step === 4) {
      fieldsToValidate = [
        "time_for_telehealth",
        "documentation_burden_concern",
        "workflow_integration",
        "referral_pathway_clarity",
        "team_coordination",
      ];
      if (isMedicalOfficer(values.clinical_role)) {
        fieldsToValidate.push("comfort_clinical_decisions_remotely");
      }
      if (isNurseMidwife(values.clinical_role)) {
        fieldsToValidate.push("comfort_patient_education_remotely");
      }
    } else if (step === 5) {
      fieldsToValidate = [
        "internet_at_workplace",
        "power_reliability",
        "device_availability",
        "private_space_for_calls",
        "facility_support",
      ];
    } else if (step === 6) {
      fieldsToValidate = [
        "barrier_liability",
        "barrier_privacy",
        "barrier_patient_digital_literacy",
        "barrier_language",
        "barrier_technical_failure",
        "barrier_effectiveness",
      ];
    } else if (step === 7) {
      fieldsToValidate = [
        "received_telehealth_training",
        "training_format_preference",
      ];
      if (values.training_needs.length === 0) {
        form.setError("training_needs", {
          message: "Please select at least one option",
        });
        return;
      }
      form.clearErrors("training_needs");
    } else if (step === 8) {
      fieldsToValidate = [
        "willing_to_provide_telehealth",
        "willing_ncd_telecare",
        "willing_routine_review",
        "willing_triage",
      ];
      if (values.preferred_modalities.length === 0) {
        form.setError("preferred_modalities", {
          message: "Please select at least one option",
        });
        return;
      }
      form.clearErrors("preferred_modalities");
      if (isMedicalOfficer(values.clinical_role)) {
        fieldsToValidate.push("willing_prescribe_after_remote");
      }
      if (isNurseMidwife(values.clinical_role)) {
        fieldsToValidate.push("willing_remote_monitoring");
      }
    }

    const isValid =
      fieldsToValidate.length === 0 ? true : await trigger(fieldsToValidate);

    if (step === 1 && values.clinical_role === "other_clinical") {
      if (!values.clinical_role_other?.trim()) {
        form.setError("clinical_role_other", {
          message: "Please specify your clinical role",
        });
        return;
      }
    }
    if (step === 1 && values.department === "other") {
      if (!values.department_other?.trim()) {
        form.setError("department_other", {
          message: "Please specify your department",
        });
        return;
      }
    }
    if (
      step === 4 &&
      isMedicalOfficer(values.clinical_role) &&
      !values.comfort_clinical_decisions_remotely
    ) {
      form.setError("comfort_clinical_decisions_remotely", {
        message: "This field is required",
      });
      return;
    }
    if (
      step === 4 &&
      isNurseMidwife(values.clinical_role) &&
      !values.comfort_patient_education_remotely
    ) {
      form.setError("comfort_patient_education_remotely", {
        message: "This field is required",
      });
      return;
    }
    if (
      step === 8 &&
      isMedicalOfficer(values.clinical_role) &&
      !values.willing_prescribe_after_remote
    ) {
      form.setError("willing_prescribe_after_remote", {
        message: "This field is required",
      });
      return;
    }
    if (
      step === 8 &&
      isNurseMidwife(values.clinical_role) &&
      !values.willing_remote_monitoring
    ) {
      form.setError("willing_remote_monitoring", {
        message: "This field is required",
      });
      return;
    }

    if (isValid) {
      if (step === 9) {
        submitForm();
      } else {
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrev = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitForm = () => {
    setIsSubmitting(true);
    const data = getValues();
    const honeypot =
      (document.querySelector('input[name="website"]') as HTMLInputElement | null)
        ?.value ?? "";

    const heardYes = data.heard_of_telehealth === "yes";
    const usedBefore = data.used_telehealth_before !== "never";
    const medical = isMedicalOfficer(data.clinical_role);
    const nurse = isNurseMidwife(data.clinical_role);

    const payload = {
      clinical_role: data.clinical_role,
      clinical_role_other:
        data.clinical_role === "other_clinical"
          ? data.clinical_role_other || null
          : null,
      department: data.department,
      department_other:
        data.department === "other" ? data.department_other || null : null,
      years_in_clinical_practice: data.years_in_clinical_practice,
      years_at_aga_health: data.years_at_aga_health,
      telehealth_exposure_in_role: data.telehealth_exposure_in_role,
      heard_of_telehealth: data.heard_of_telehealth,
      awareness_sources: heardYes
        ? toApiMultiSelect(data.awareness_sources)
        : null,
      awareness_sources_other:
        heardYes && data.awareness_sources.includes("other")
          ? data.awareness_sources_other || null
          : null,
      used_telehealth_before: data.used_telehealth_before,
      used_modalities: usedBefore
        ? toApiMultiSelect(data.used_modalities)
        : null,
      national_policy_awareness: data.national_policy_awareness,
      confidence_video_consultation: data.confidence_video_consultation,
      confidence_phone_followup: data.confidence_phone_followup,
      confidence_async_messaging: data.confidence_async_messaging,
      confidence_remote_vitals: data.confidence_remote_vitals,
      confidence_digital_documentation: data.confidence_digital_documentation,
      time_for_telehealth: data.time_for_telehealth,
      documentation_burden_concern: data.documentation_burden_concern,
      workflow_integration: data.workflow_integration,
      referral_pathway_clarity: data.referral_pathway_clarity,
      team_coordination: data.team_coordination,
      comfort_clinical_decisions_remotely: medical
        ? data.comfort_clinical_decisions_remotely || null
        : null,
      comfort_patient_education_remotely: nurse
        ? data.comfort_patient_education_remotely || null
        : null,
      internet_at_workplace: data.internet_at_workplace,
      power_reliability: data.power_reliability,
      device_availability: data.device_availability,
      private_space_for_calls: data.private_space_for_calls,
      facility_support: data.facility_support,
      barrier_liability: data.barrier_liability,
      barrier_privacy: data.barrier_privacy,
      barrier_patient_digital_literacy: data.barrier_patient_digital_literacy,
      barrier_language: data.barrier_language,
      barrier_technical_failure: data.barrier_technical_failure,
      barrier_effectiveness: data.barrier_effectiveness,
      other_barriers: toApiMultiSelect(data.other_barriers),
      other_barriers_text: data.other_barriers.includes("other")
        ? data.other_barriers_text || null
        : null,
      received_telehealth_training: data.received_telehealth_training,
      training_needs: toApiMultiSelect(data.training_needs),
      training_format_preference: data.training_format_preference,
      willing_to_provide_telehealth: data.willing_to_provide_telehealth,
      willing_ncd_telecare: data.willing_ncd_telecare,
      willing_routine_review: data.willing_routine_review,
      willing_triage: data.willing_triage,
      preferred_modalities: toApiMultiSelect(data.preferred_modalities),
      willing_prescribe_after_remote: medical
        ? data.willing_prescribe_after_remote || null
        : null,
      willing_remote_monitoring: nurse
        ? data.willing_remote_monitoring || null
        : null,
      suggestions: data.suggestions?.trim() || null,
      consent_given: data.consent_given,
    };

    submitSurvey.mutate(
      { data: { ...payload, website: honeypot, form_started_at: formStartedAt.current } as any },
      {
        onSuccess: () => {
          setStep(10);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onError: (err) => {
          console.error("Submission failed", err);
          alert("Failed to submit survey. Please try again.");
          setIsSubmitting(false);
        },
      },
    );
  };

  const renderConsent = () => (
    <div className="space-y-6 py-4 animate-in fade-in duration-300">
      <div className="flex flex-col items-center text-center space-y-3 pb-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Informed Consent</h1>
        <p className="text-muted-foreground text-sm max-w-xl">
          Please read this carefully before proceeding with the survey.
        </p>
      </div>

      <div className="bg-muted/40 rounded-xl border p-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <div>
          <p className="font-semibold text-foreground mb-1">Study Title</p>
          <p>{cfg.fullTitle}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Principal Investigator</p>
          <p>{cfg.principalInvestigator}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Ethics Approval</p>
          <p>{cfg.ethicsReference}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Contact</p>
          <p>
            {cfg.contactEmail} · {cfg.contactPhone}
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Purpose</p>
          <p>
            This survey asks about your experience and views on telehealth/telecare at
            AGA Health Foundation. Your responses are confidential. We do not ask for your
            name. Department and job role are collected only to analyse differences between
            staff groups. Participation is voluntary and will not affect your employment.
            You may skip questions or withdraw at any time before submitting.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Duration</p>
          <p>The survey takes approximately {cfg.estimatedMinutes} minutes to complete.</p>
        </div>
      </div>

      <FormField
        control={control}
        name="consent_given"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-0.5"
              />
            </FormControl>
            <div className="space-y-1 leading-relaxed">
              <FormLabel className="text-sm font-medium text-foreground cursor-pointer">
                I have read the information above and agree to participate voluntarily.
              </FormLabel>
              {form.formState.errors.consent_given && (
                <FormMessage>You must agree to continue</FormMessage>
              )}
            </div>
          </FormItem>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => navigate(studyPaths.landing)}
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>
        <Button type="button" className="flex-1" onClick={handleNext}>
          I Agree, Continue <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-16">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-heading font-bold text-foreground">Thank You!</h2>
      <p className="text-muted-foreground max-w-[500px] leading-relaxed">
        Your response has been successfully recorded. Your input helps AGA Health Foundation
        plan telehealth services that work for clinicians and patients.
      </p>
    </div>
  );

  const progress = (step / 9) * 100;

  if (!surveyOpen) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Survey unavailable</CardTitle>
            <CardDescription>
              {collectionStatus?.message ?? "Survey collection is currently closed."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(studyPaths.landing)}>Back to study home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {step > 0 && step < 10 && (
          <div className="mb-8 space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-muted-foreground">Section {step} of 9</span>
              <span className="text-primary">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <h2 className="text-2xl font-heading font-bold text-foreground pt-4">
              {SECTIONS[step]}
            </h2>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <Form {...form}>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <form onSubmit={(e) => e.preventDefault()} className="p-6 md:p-8 space-y-8">
              {step === 0 && renderConsent()}
              {step === 10 && renderSuccess()}

              {step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={control}
                    name="clinical_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          What is your primary clinical role at AGA Health Foundation?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Medical officer", value: "medical_officer" },
                              { label: "Nurse or Midwife", value: "nurse_midwife" },
                              { label: "Allied health (pharmacy, lab, physio, etc.)", value: "allied_health" },
                              { label: "Other clinical role", value: "other_clinical" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {values.clinical_role === "other_clinical" && (
                    <FormField
                      control={control}
                      name="clinical_role_other"
                      render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                          <FormLabel className="text-base">
                            Please specify your clinical role{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              maxLength={100}
                              placeholder="Your clinical role"
                              className="h-12 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Which department or unit do you mainly work in?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="opd">Outpatient (OPD)</SelectItem>
                              <SelectItem value="ncd_clinic">NCD clinic (Diabetes Clinic)</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="inpatient">Inpatient</SelectItem>
                              <SelectItem value="maternity">Maternity</SelectItem>
                              <SelectItem value="pharmacy">Pharmacy</SelectItem>
                              <SelectItem value="laboratory">Laboratory</SelectItem>
                              <SelectItem value="community_health">RCH/Community health</SelectItem>
                              <SelectItem value="other">Other (specify below)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {values.department === "other" && (
                    <FormField
                      control={control}
                      name="department_other"
                      render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                          <FormLabel className="text-base">
                            Please specify department{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              maxLength={100}
                              placeholder="Your department"
                              className="h-12 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={control}
                    name="years_in_clinical_practice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          How many years have you worked in clinical practice (any setting)?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Less than 2 years", value: "less_than_2" },
                              { label: "2–5 years", value: "2_to_5" },
                              { label: "6–10 years", value: "6_to_10" },
                              { label: "More than 10 years", value: "more_than_10" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="years_at_aga_health"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          How long have you worked at AGA Health Foundation?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Less than 1 year", value: "less_than_1" },
                              { label: "1–3 years", value: "1_to_3" },
                              { label: "4–7 years", value: "4_to_7" },
                              { label: "More than 7 years", value: "more_than_7" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="telehealth_exposure_in_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          In your current role, how often do you interact with patients who
                          could use telehealth for follow-up or monitoring?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Never", value: "never" },
                              { label: "Rarely", value: "rarely" },
                              { label: "Sometimes", value: "sometimes" },
                              { label: "Often", value: "often" },
                              { label: "Very often", value: "very_often" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Info className="w-5 h-5" />
                      <p>What is telehealth?</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <em>Telehealth</em> means delivering healthcare at a distance using phone,
                      video, or digital messaging. <em>Telecare</em> includes remote monitoring
                      and follow-up for ongoing conditions such as hypertension and diabetes.
                    </p>
                  </div>

                  <FormField
                    control={control}
                    name="heard_of_telehealth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Before today, had you heard of telehealth or telecare?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Yes", value: "yes" },
                              { label: "No", value: "no" },
                              { label: "Not sure", value: "not_sure" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {values.heard_of_telehealth === "yes" && (
                    <div className="space-y-6 pl-4 border-l-2 border-primary/20 ml-2 py-2">
                      <FormField
                        control={control}
                        name="awareness_sources"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">
                              Where did you learn about telehealth? (Select all that apply)
                            </FormLabel>
                            <FormControl>
                              <MultiSelectGroup
                                options={[
                                  { label: "Workplace training", value: "workplace_training" },
                                  { label: "Colleague", value: "colleague" },
                                  { label: "Conference", value: "conference" },
                                  { label: "Media", value: "media" },
                                  { label: "Patient request", value: "patient_request" },
                                  { label: "COVID period", value: "covid_period" },
                                  { label: "Professional body", value: "professional_education" },
                                  { label: "Other", value: "other" },
                                ]}
                                value={field.value || []}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {values.awareness_sources?.includes("other") && (
                        <FormField
                          control={control}
                          name="awareness_sources_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">Other source</FormLabel>
                              <FormControl>
                                <Input className="h-12" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  <FormField
                    control={control}
                    name="used_telehealth_before"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Have you personally used telehealth to care for patients (video, phone,
                          or messaging)? <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Never", value: "never" },
                              { label: "During COVID only", value: "during_covid_only" },
                              { label: "Occasionally", value: "occasionally" },
                              { label: "Regularly", value: "regularly" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {values.used_telehealth_before &&
                    values.used_telehealth_before !== "never" && (
                      <FormField
                        control={control}
                        name="used_modalities"
                        render={({ field }) => (
                          <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                            <FormLabel className="text-base">
                              Which modalities have you used? (Select all that apply)
                            </FormLabel>
                            <FormControl>
                              <MultiSelectGroup
                                options={[
                                  { label: "Phone / voice", value: "phone_voice" },
                                  { label: "Video call", value: "video_call" },
                                  { label: "SMS / WhatsApp", value: "sms_whatsapp" },
                                  { label: "Patient portal", value: "patient_portal" },
                                  { label: "Remote monitoring", value: "remote_monitoring" },
                                  { label: "Other", value: "other" },
                                ]}
                                value={field.value || []}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                  <FormField
                    control={control}
                    name="national_policy_awareness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Are you aware of any national guidance on telemedicine or digital
                          health in Ghana (e.g. Ministry of Health, NHIA)?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Yes", value: "yes" },
                              { label: "No", value: "no" },
                              { label: "Not sure", value: "not_sure" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <p className="text-muted-foreground">
                    For each statement, rate your confidence from 1 (not at all confident) to 5
                    (very confident).
                  </p>

                  {(
                    [
                      ["confidence_video_consultation", "Conducting a video consultation with a stable patient"],
                      ["confidence_phone_followup", "Following up with a patient by phone for chronic disease care"],
                      ["confidence_async_messaging", "Using secure messaging for non-urgent clinical questions"],
                      ["confidence_remote_vitals", "Interpreting patient-reported vitals or home readings (e.g. BP, glucose)"],
                      ["confidence_digital_documentation", "Documenting a telehealth encounter in the patient record"],
                    ] as const
                  ).map(([name, label]) => (
                    <FormField
                      key={name}
                      control={control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">
                            {label} <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <LikertScale
                              minLabel="Not at all confident"
                              maxLabel="Very confident"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={control}
                    name="time_for_telehealth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          I have enough time in my schedule to offer telehealth alongside
                          in-person care <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <LikertScale
                            minLabel="Strongly disagree"
                            maxLabel="Strongly agree"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="documentation_burden_concern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Telehealth would increase my documentation burden unacceptably{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <LikertScale
                            minLabel="Strongly disagree"
                            maxLabel="Strongly agree"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="workflow_integration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          How well would telehealth fit into your current clinical workflow?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Not at all", value: "not_at_all" },
                              { label: "Poorly", value: "poorly" },
                              { label: "Moderately", value: "moderately" },
                              { label: "Well", value: "well" },
                              { label: "Very well", value: "very_well" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="referral_pathway_clarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Referral and escalation pathways for telehealth patients would be
                          clear to me <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <LikertScale
                            minLabel="Strongly disagree"
                            maxLabel="Strongly agree"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="team_coordination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Telehealth at AGA would require effective coordination with other
                          departments (lab, pharmacy, etc.){" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={AGREE_SCALE}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isMedicalOfficer(values.clinical_role) && (
                    <FormField
                      control={control}
                      name="comfort_clinical_decisions_remotely"
                      render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                          <FormLabel className="text-base">
                            Making clinical decisions remotely without an in-person examination
                            when appropriate <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <LikertScale
                              minLabel="Not at all comfortable"
                              maxLabel="Very comfortable"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {isNurseMidwife(values.clinical_role) && (
                    <FormField
                      control={control}
                      name="comfort_patient_education_remotely"
                      render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                          <FormLabel className="text-base">
                            Providing patient education and self-management support remotely{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <LikertScale
                              minLabel="Not at all comfortable"
                              maxLabel="Very comfortable"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={control}
                    name="internet_at_workplace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Internet reliability at your main workplace{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "None", value: "none" },
                              { label: "Poor", value: "poor" },
                              { label: "Fair", value: "fair" },
                              { label: "Good", value: "good" },
                              { label: "Excellent", value: "excellent" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="power_reliability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Power (electricity) reliability during your clinical shifts{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Frequent outages", value: "frequent_outages" },
                              { label: "Occasional outages", value: "occasional_outages" },
                              { label: "Mostly stable", value: "mostly_stable" },
                              { label: "Very stable", value: "very_stable" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="device_availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Access to a suitable device for telehealth (smartphone, tablet, or
                          computer) during work <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Never", value: "never" },
                              { label: "Sometimes", value: "sometimes" },
                              { label: "Usually", value: "usually" },
                              { label: "Always", value: "always" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="private_space_for_calls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Availability of a private space for confidential video or phone
                          consultations <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Never", value: "never" },
                              { label: "Sometimes", value: "sometimes" },
                              { label: "Usually", value: "usually" },
                              { label: "Always", value: "always" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="facility_support"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          AGA Health Foundation would provide adequate technical support for
                          telehealth <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <LikertScale
                            minLabel="Strongly disagree"
                            maxLabel="Strongly agree"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 6 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <p className="text-muted-foreground">
                    Rate how much each factor would limit your use of telehealth (1 = not a
                    barrier, 5 = major barrier).
                  </p>

                  {(
                    [
                      ["barrier_liability", "Medico-legal liability or malpractice concerns"],
                      ["barrier_privacy", "Patient privacy and confidentiality"],
                      ["barrier_patient_digital_literacy", "Patients' low digital literacy or access"],
                      ["barrier_language", "Language or communication barriers with patients"],
                      ["barrier_technical_failure", "Technology failure during a consultation"],
                      ["barrier_effectiveness", "Doubt that telehealth is as effective as in-person care"],
                    ] as const
                  ).map(([name, label]) => (
                    <FormField
                      key={name}
                      control={control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">
                            {label} <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <LikertScale
                              minLabel="Not a barrier"
                              maxLabel="Major barrier"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <FormField
                    control={control}
                    name="other_barriers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Any other barriers? (Select all that apply)
                        </FormLabel>
                        <FormControl>
                          <MultiSelectGroup
                            options={[
                              { label: "Cost to patient", value: "cost_to_patient" },
                              { label: "NHIA reimbursement", value: "nhia_reimbursement" },
                              { label: "Lack of guidelines", value: "lack_of_guidelines" },
                              { label: "Workload", value: "workload" },
                              { label: "None", value: "none" },
                              { label: "Other", value: "other" },
                            ]}
                            value={field.value || []}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {values.other_barriers?.includes("other") && (
                    <FormField
                      control={control}
                      name="other_barriers_text"
                      render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                          <FormLabel className="text-base">
                            Please describe other barriers
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe other barriers..."
                              className="min-h-[100px] resize-none"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {step === 7 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={control}
                    name="received_telehealth_training"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Have you received formal training on telehealth at AGA or elsewhere?{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "Yes, at AGA", value: "yes_aga" },
                              { label: "Yes, elsewhere", value: "yes_elsewhere" },
                              { label: "No", value: "no" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="training_needs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          What training would help you use telehealth confidently? (Select all
                          that apply) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <MultiSelectGroup
                            options={[
                              { label: "Basic digital skills", value: "basic_digital_skills" },
                              { label: "Video consultation skills", value: "video_consultation_skills" },
                              { label: "Platform-specific training", value: "platform_specific" },
                              { label: "Clinical protocols", value: "clinical_protocols" },
                              { label: "Documentation", value: "documentation" },
                              { label: "Privacy & security", value: "privacy_security" },
                              { label: "Patient selection", value: "patient_selection" },
                              { label: "None needed", value: "none_needed" },
                              { label: "Other", value: "other" },
                            ]}
                            value={field.value || []}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        {form.formState.errors.training_needs && (
                          <FormMessage>{form.formState.errors.training_needs.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="training_format_preference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Preferred training format <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={[
                              { label: "In-person workshop", value: "in_person_workshop" },
                              { label: "Online self-paced", value: "online_self_paced" },
                              { label: "Mentorship", value: "mentorship" },
                              { label: "Simulation", value: "simulation" },
                              { label: "Written guidelines", value: "written_guidelines" },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 8 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <CardDescription>
                    These items mirror the community survey outcomes so results can be compared
                    across arms.
                  </CardDescription>

                  <FormField
                    control={control}
                    name="willing_to_provide_telehealth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Overall willingness to provide telehealth services at AGA{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <LikertScale
                            minLabel="Not willing"
                            maxLabel="Very willing"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="willing_ncd_telecare"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Willing to provide telecare for NCD follow-up (e.g. hypertension,
                          diabetes) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={YES_MAYBE_NO}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="willing_routine_review"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Willing to provide routine review consultations remotely when
                          clinically appropriate <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={YES_MAYBE_NO}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="willing_triage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Willing to conduct initial triage or assessment remotely before
                          in-person visit <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <CardRadioGroup
                            options={YES_MAYBE_NO}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="preferred_modalities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Which modalities would you prefer to use? (Select all that apply){" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <MultiSelectGroup
                            options={[
                              { label: "Phone", value: "phone" },
                              { label: "Video", value: "video" },
                              { label: "Secure messaging", value: "secure_messaging" },
                              { label: "Home monitoring", value: "home_monitoring" },
                              { label: "None", value: "none" },
                            ]}
                            value={field.value || []}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        {form.formState.errors.preferred_modalities && (
                          <FormMessage>
                            {form.formState.errors.preferred_modalities.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />

                  {isMedicalOfficer(values.clinical_role) && (
                    <FormField
                      control={control}
                      name="willing_prescribe_after_remote"
                      render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                          <FormLabel className="text-base">
                            Willing to prescribe or adjust treatment after a remote consultation
                            when guidelines allow <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <CardRadioGroup
                              options={YES_MAYBE_NO}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {isNurseMidwife(values.clinical_role) && (
                    <FormField
                      control={control}
                      name="willing_remote_monitoring"
                      render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                          <FormLabel className="text-base">
                            Willing to review and act on remotely submitted patient readings
                            (BP, glucose, etc.) <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <CardRadioGroup
                              options={YES_MAYBE_NO}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {step === 9 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={control}
                    name="suggestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          What would make telehealth work well for you and your patients at AGA?
                          (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            maxLength={1000}
                            placeholder="Share your ideas..."
                            className="min-h-[150px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Maximum 1000 characters</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step > 0 && step < 10 && (
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handlePrev}
                    className="w-32"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>

                  {step < 9 ? (
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleNext}
                      className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Next <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="w-40 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Survey"}
                      {!isSubmitting && <CheckCircle2 className="ml-2 w-4 h-4" />}
                    </Button>
                  )}
                </div>
              )}
            </form>
          </Form>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground pb-4">
          {cfg.organization} · {cfg.location}
        </div>
      </div>
    </div>
  );
}
