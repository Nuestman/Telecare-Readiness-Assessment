import { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitSurvey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Info } from "lucide-react";

// Types mapping helper
const toApiMultiSelect = (val: string[] | undefined) => val ? val.join(",") : null;

// Multi-select Checkbox group component
function MultiSelectGroup({ options, value = [], onChange }: { options: { label: string, value: string }[], value: string[], onChange: (val: string[]) => void }) {
  const idPrefix = useId();
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.value} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
          <Checkbox
            id={`${idPrefix}-${opt.value}`}
            className="rounded-none"
            checked={value.includes(opt.value)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...value, opt.value]);
              } else {
                onChange(value.filter((v) => v !== opt.value));
              }
            }}
          />
          <div className="space-y-1 leading-none w-full cursor-pointer">
            <Label htmlFor={`${idPrefix}-${opt.value}`} className="cursor-pointer flex-1 font-medium">{opt.label}</Label>
          </div>
        </div>
      ))}
    </div>
  );
}

// Custom Radio group component to look like cards
function CardRadioGroup({ options, value, onChange }: { options: { label: string, value: string }[], value?: string, onChange: (val: string) => void }) {
  const idPrefix = useId();
  return (
    <RadioGroup onValueChange={onChange} value={value} className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.value}>
          <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} className="peer sr-only" />
          <Label
            htmlFor={`${idPrefix}-${opt.value}`}
            className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm cursor-pointer transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary font-medium text-foreground"
          >
            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-primary peer-data-[state=checked]:border-primary mr-2 shrink-0">
              <div className={`w-2 h-2 rounded-full ${value === opt.value ? 'bg-primary' : 'bg-transparent'}`} />
            </div>
            {opt.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

// Horizontal 1–5 Likert scale
function LikertScale({ value, onChange, minLabel, maxLabel }: { value?: string, onChange: (val: string) => void, minLabel: string, maxLabel: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-stretch justify-between gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(String(num))}
            className={`flex-1 rounded-md border p-3 text-center transition-all hover:bg-muted/50 ${value === String(num) ? 'border-primary bg-primary/10 text-primary font-bold' : 'bg-card text-foreground'}`}
          >
            <span className="block text-lg font-semibold">{num}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

// We'll just define the interface for our form
const formSchema = z.object({
  age_group: z.string().min(1, "This field is required"),
  gender: z.string().min(1, "This field is required"),
  employment_type: z.string().min(1, "This field is required"),
  contractor_company: z.string().optional(),
  work_area: z.string().min(1, "This field is required"),
  work_area_other: z.string().optional(),
  years_at_aga: z.string().min(1, "This field is required"),
  has_ncd: z.string().min(1, "This field is required"),
  ncd_types: z.array(z.string()).default([]),
  other_ncd: z.string().optional(),
  currently_on_treatment: z.string().optional(),
  treatment_location: z.string().optional(),
  attends_followup: z.string().min(1, "This field is required"),
  missed_followup_reasons: z.array(z.string()).default([]),
  other_missed_reason: z.string().optional(),
  has_smartphone: z.string().min(1, "This field is required"),
  smartphone_usage: z.string().optional(),
  has_internet: z.string().min(1, "This field is required"),
  internet_quality: z.string().optional(),
  comfortable_with_video_call: z.string().min(1, "This field is required"),
  heard_of_telehealth: z.string().min(1, "This field is required"),
  telehealth_sources: z.array(z.string()).default([]),
  used_telehealth_before: z.string().min(1, "This field is required"),
  willing_to_use_telehealth: z.string().min(1, "This field is required"),
  preferred_telehealth_mode: z.string().optional(),
  preferred_telehealth_use: z.array(z.string()).default([]),
  willing_for_ncd_telecare: z.string().optional(),
  willing_for_followup_telecare: z.string().optional(),
  privacy_concern: z.string().min(1, "This field is required"),
  technical_difficulty_concern: z.string().min(1, "This field is required"),
  effectiveness_concern: z.string().min(1, "This field is required"),
  other_concerns: z.string().optional(),
  suggestions: z.string().optional(),
  consent_given: z.boolean().refine(val => val === true, "You must provide consent to submit")
});

type FormValues = z.infer<typeof formSchema>;

import { Label } from "@/components/ui/label";

const defaultValues: FormValues = {
  age_group: "", gender: "", employment_type: "", contractor_company: "", work_area: "", work_area_other: "", years_at_aga: "",
  has_ncd: "", ncd_types: [], other_ncd: "", currently_on_treatment: "", treatment_location: "",
  attends_followup: "", missed_followup_reasons: [], other_missed_reason: "",
  has_smartphone: "", smartphone_usage: "", has_internet: "", internet_quality: "", comfortable_with_video_call: "",
  heard_of_telehealth: "", telehealth_sources: [], used_telehealth_before: "",
  willing_to_use_telehealth: "", preferred_telehealth_mode: "", preferred_telehealth_use: [], willing_for_ncd_telecare: "", willing_for_followup_telecare: "",
  privacy_concern: "", technical_difficulty_concern: "", effectiveness_concern: "", other_concerns: "",
  suggestions: "", consent_given: false
};

const SECTIONS = [
  "Welcome",
  "Demographics",
  "Health Background",
  "Follow-up Behaviour",
  "Technology Access",
  "Telehealth Awareness",
  "Readiness & Willingness",
  "Concerns",
  "Open-ended"
];

export default function SurveyPage() {
  const [step, setStep] = useState(0); // 0 is Consent, 1-8 are sections, 9 is Thank You
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { watch, control, trigger, getValues, setValue } = form;
  const values = watch();
  
  const submitSurvey = useSubmitSurvey();

  const handleNext = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    if (step === 0) fieldsToValidate = ["consent_given"];
    else if (step === 1) {
      fieldsToValidate = ["age_group", "gender", "employment_type", "work_area", "years_at_aga"];
      if (values.employment_type === "contractor") fieldsToValidate.push("contractor_company");
      if (values.work_area === "other") fieldsToValidate.push("work_area_other");
    }
    else if (step === 2) {
      fieldsToValidate = ["has_ncd"];
      if (values.has_ncd === "yes") fieldsToValidate.push("currently_on_treatment");
    }
    else if (step === 3) fieldsToValidate = ["attends_followup"];
    else if (step === 4) {
      fieldsToValidate = ["has_smartphone", "has_internet", "comfortable_with_video_call"];
    }
    else if (step === 5) fieldsToValidate = ["heard_of_telehealth", "used_telehealth_before"];
    else if (step === 6) fieldsToValidate = ["willing_to_use_telehealth"];
    else if (step === 7) fieldsToValidate = ["privacy_concern", "technical_difficulty_concern", "effectiveness_concern"];
    // step 8 (open-ended) has no required fields

    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      if (step === 8) {
        submitForm();
      } else {
        setStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrev = () => {
    setStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitForm = () => {
    setIsSubmitting(true);
    const data = getValues();
    
    // Transform arrays to comma-separated strings
    const payload = {
      ...data,
      contractor_company: data.employment_type === "contractor" ? data.contractor_company : null,
      work_area: data.work_area === "other" ? data.work_area_other : data.work_area,
      ncd_types: data.has_ncd === 'yes' && data.ncd_types.length > 0 ? toApiMultiSelect(data.ncd_types) : null,
      other_ncd: data.has_ncd === 'yes' && data.ncd_types.includes('other') ? data.other_ncd : null,
      currently_on_treatment: data.has_ncd === 'yes' ? data.currently_on_treatment : null,
      treatment_location: data.has_ncd === 'yes' && data.currently_on_treatment === 'yes' ? data.treatment_location : null,
      
      missed_followup_reasons: data.attends_followup !== 'always' && data.missed_followup_reasons.length > 0 ? toApiMultiSelect(data.missed_followup_reasons) : null,
      other_missed_reason: data.attends_followup !== 'always' && data.missed_followup_reasons.includes('other') ? data.other_missed_reason : null,
      
      smartphone_usage: data.has_smartphone === 'yes' ? data.smartphone_usage : null,
      internet_quality: data.has_internet === 'yes' ? data.internet_quality : null,
      
      telehealth_sources: data.heard_of_telehealth === 'yes' && data.telehealth_sources.length > 0 ? toApiMultiSelect(data.telehealth_sources) : null,
      
      preferred_telehealth_use: data.preferred_telehealth_use.length > 0 ? toApiMultiSelect(data.preferred_telehealth_use) : null,
    };

    submitSurvey.mutate({ data: payload as any }, {
      onSuccess: () => {
        setIsSuccess(true);
        setStep(9); // Success screen
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (err) => {
        console.error("Submission failed", err);
        alert("Failed to submit survey. Please try again.");
        setIsSubmitting(false);
      }
    });
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
          <p>Assessment of Telehealth Readiness Among AGA Obuasi Mine Employees and Contractors</p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Purpose</p>
          <p>
            This research is conducted by AGA Health Foundation to explore the feasibility and acceptance of
            telehealth/telecare services among mine workers at AGA Obuasi. The findings will guide the
            development of digital health services tailored to your needs — particularly for non-communicable
            disease (NCD) management and routine review/follow-up appointments.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Voluntary Participation</p>
          <p>
            Your participation is entirely voluntary. You may withdraw at any time by simply closing the
            survey without penalty or consequence.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Confidentiality &amp; Anonymity</p>
          <p>
            This survey is anonymous. No names, employee IDs, or personal identifiers are collected.
            Your responses will be used solely for research purposes and will be reported only in
            aggregate form. Individual responses will not be shared with your employer or any third party.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Duration</p>
          <p>The survey takes approximately 5–8 minutes to complete.</p>
        </div>
      </div>

      <FormField control={control} name="consent_given" render={({ field }) => (
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
              I have read and understood the information above. I voluntarily agree to participate in this survey and consent to my anonymous responses being used for research by AGA Health Foundation.
            </FormLabel>
            {form.formState.errors.consent_given && (
              <FormMessage>You must agree to continue</FormMessage>
            )}
          </div>
        </FormItem>
      )} />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleNext}
        >
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
      <h2 className="text-3xl font-heading font-bold text-foreground">
        Thank You!
      </h2>
      <p className="text-muted-foreground max-w-[500px] leading-relaxed">
        Your response has been successfully recorded. Your input is vital to helping AGA Health Foundation improve healthcare access for everyone.
      </p>
    </div>
  );

  const progress = (step / 8) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {step > 0 && step < 9 && (
          <div className="mb-8 space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-muted-foreground">Section {step} of 8</span>
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
            <form onSubmit={(e) => e.preventDefault()} className="p-6 md:p-8 space-y-8">
              
              {step === 0 && renderConsent()}
              {step === 9 && renderSuccess()}

              {/* SECTION 1: DEMOGRAPHICS */}
              {step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField control={control} name="age_group" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What is your age group? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "18-30 years", value: "18-30" },
                            { label: "31-40 years", value: "31-40" },
                            { label: "41-50 years", value: "41-50" },
                            { label: "50+ years", value: "50+" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.age_group && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  <FormField control={control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Gender <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Male", value: "male" },
                            { label: "Female", value: "female" },
                            { label: "Prefer not to say", value: "prefer_not_to_say" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.gender && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  <FormField control={control} name="employment_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Employment Type <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Employee", value: "employee" },
                            { label: "Contractor", value: "contractor" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.employment_type && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  {values.employment_type === "contractor" && (
                    <FormField control={control} name="contractor_company" render={({ field }) => (
                      <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                        <FormLabel className="text-base">Company Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ABC Mining Services" className="h-12 text-base" {...field} />
                        </FormControl>
                        {form.formState.errors.contractor_company && <FormMessage>Please enter your company name</FormMessage>}
                      </FormItem>
                    )} />
                  )}

                  <FormField control={control} name="work_area" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Work Area / Department <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mining">Mining / Operations</SelectItem>
                            <SelectItem value="engineering">Engineering / Maintenance</SelectItem>
                            <SelectItem value="safety">Safety / Environment</SelectItem>
                            <SelectItem value="hr">Human Resources / Admin</SelectItem>
                            <SelectItem value="finance">Finance / Procurement</SelectItem>
                            <SelectItem value="health">Health / Medical</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="supply_chain">Supply Chain / Logistics</SelectItem>
                            <SelectItem value="other">Other (specify below)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      {form.formState.errors.work_area && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  {values.work_area === "other" && (
                    <FormField control={control} name="work_area_other" render={({ field }) => (
                      <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                        <FormLabel className="text-base">Specify Department <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Type your department" className="h-12 text-base" {...field} />
                        </FormControl>
                        {form.formState.errors.work_area_other && <FormMessage>Please specify your department</FormMessage>}
                      </FormItem>
                    )} />
                  )}

                  <FormField control={control} name="years_at_aga" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Years at AGA Obuasi <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Less than 1 year", value: "less_than_1" },
                            { label: "1-3 years", value: "1_to_3" },
                            { label: "4-6 years", value: "4_to_6" },
                            { label: "7-10 years", value: "7_to_10" },
                            { label: "More than 10 years", value: "more_than_10" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.years_at_aga && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />
                </div>
              )}

              {/* SECTION 2: HEALTH BACKGROUND */}
              {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField control={control} name="has_ncd" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Do you have any non-communicable disease (NCD) e.g. hypertension, diabetes? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Yes", value: "yes" },
                            { label: "No", value: "no" },
                            { label: "Prefer not to say", value: "prefer_not_to_say" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.has_ncd && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  {values.has_ncd === "yes" && (
                    <div className="space-y-8 pl-4 border-l-2 border-primary/20 ml-2 py-2">
                      <FormField control={control} name="ncd_types" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">If yes, which? (Select all that apply)</FormLabel>
                          <FormControl>
                            <MultiSelectGroup 
                              options={[
                                { label: "Hypertension (High Blood Pressure)", value: "hypertension" },
                                { label: "Diabetes", value: "diabetes" },
                                { label: "Asthma", value: "asthma" },
                                { label: "Obesity", value: "obesity" },
                                { label: "Heart disease", value: "heart_disease" },
                                { label: "Other", value: "other" }
                              ]}
                              value={field.value || []} onChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )} />

                      {values.ncd_types?.includes("other") && (
                        <FormField control={control} name="other_ncd" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Please specify other NCD</FormLabel>
                            <FormControl>
                              <Input className="h-12" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                      )}

                      <FormField control={control} name="currently_on_treatment" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Are you currently on treatment?</FormLabel>
                          <FormControl>
                            <CardRadioGroup 
                              options={[
                                { label: "Yes", value: "yes" },
                                { label: "No", value: "no" }
                              ]}
                              value={field.value} onChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )} />

                      {values.currently_on_treatment === "yes" && (
                        <FormField control={control} name="treatment_location" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Where do you receive treatment?</FormLabel>
                            <FormControl>
                              <CardRadioGroup 
                                options={[
                                  { label: "AGA Health Foundation", value: "aga_health_foundation" },
                                  { label: "Obuasi Government Hospital", value: "government_hospital" },
                                  { label: "Bryant Mission Hospital", value: "bryant_mission" },
                                  { label: "Neighborhood Hospital", value: "neighborhood_hospital" },
                                  { label: "SDA Hospital", value: "sda_hospital" },
                                  { label: "Todah Hospital", value: "todah_hospital" },
                                  { label: "Obuasi Diagnostic", value: "obuasi_diagnostic" },
                                  { label: "Other", value: "other" }
                                ]}
                                value={field.value} onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: FOLLOW-UP BEHAVIOUR */}
              {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField control={control} name="attends_followup" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">How often do you attend scheduled follow-up/review visits? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Always", value: "always" },
                            { label: "Sometimes", value: "sometimes" },
                            { label: "Rarely", value: "rarely" },
                            { label: "Never", value: "never" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.attends_followup && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  {values.attends_followup && values.attends_followup !== "always" && (
                    <div className="space-y-8 pl-4 border-l-2 border-primary/20 ml-2 py-2">
                      <FormField control={control} name="missed_followup_reasons" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">If not always, why? (Select all that apply)</FormLabel>
                          <FormControl>
                            <MultiSelectGroup 
                              options={[
                                { label: "Busy work schedule", value: "busy_schedule" },
                                { label: "Distance/transport issues", value: "distance" },
                                { label: "Cost of transport/treatment", value: "cost" },
                                { label: "I forget", value: "forgot" },
                                { label: "I feel well so I don't go", value: "feeling_well" },
                                { label: "Other", value: "other" }
                              ]}
                              value={field.value || []} onChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )} />

                      {values.missed_followup_reasons?.includes("other") && (
                        <FormField control={control} name="other_missed_reason" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Please specify other reason</FormLabel>
                            <FormControl>
                              <Input className="h-12" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: TECHNOLOGY ACCESS */}
              {step === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField control={control} name="has_smartphone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Do you own a smartphone? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Yes", value: "yes" },
                            { label: "No", value: "no" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.has_smartphone && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  {values.has_smartphone === "yes" && (
                    <FormField control={control} name="smartphone_usage" render={({ field }) => (
                      <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                        <FormLabel className="text-base">How do you use your smartphone?</FormLabel>
                        <FormControl>
                          <CardRadioGroup 
                            options={[
                              { label: "Basic calls/texts only", value: "basic_calls_only" },
                              { label: "Some apps (WhatsApp, Facebook)", value: "some_apps" },
                              { label: "Frequent app user (Banking, Health, Social)", value: "frequent_apps" },
                              { label: "Advanced (Work apps, meetings)", value: "advanced" }
                            ]}
                            value={field.value} onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  )}

                  <FormField control={control} name="has_internet" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Do you have internet access? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Yes", value: "yes" },
                            { label: "No", value: "no" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.has_internet && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  {values.has_internet === "yes" && (
                    <FormField control={control} name="internet_quality" render={({ field }) => (
                      <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                        <FormLabel className="text-base">How would you rate your internet quality?</FormLabel>
                        <FormControl>
                          <CardRadioGroup 
                            options={[
                              { label: "Poor", value: "poor" },
                              { label: "Fair", value: "fair" },
                              { label: "Good", value: "good" },
                              { label: "Very good", value: "very_good" }
                            ]}
                            value={field.value} onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  )}

                  <FormField control={control} name="comfortable_with_video_call" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">How comfortable are you making video calls? <span className="text-destructive">*</span></FormLabel>
                      <CardDescription className="mb-3">Rate from 1 (Very uncomfortable) to 5 (Very comfortable)</CardDescription>
                      <FormControl>
                        <LikertScale
                          minLabel="Very uncomfortable"
                          maxLabel="Very comfortable"
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.comfortable_with_video_call && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />
                </div>
              )}

              {/* SECTION 5: TELEHEALTH AWARENESS */}
              {step === 5 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Info className="w-5 h-5" />
                      <p>What is telehealth?</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Telehealth (also called telemedicine) means getting healthcare services using technology — such as a phone, video call, or messaging app — instead of visiting the hospital or clinic in person. It lets you speak with a doctor or nurse, get a prescription, or follow up on an existing condition without travelling to the facility. Examples include a WhatsApp video call with a doctor, a phone call for a prescription refill, or a chat-based consultation.
                    </p>
                  </div>

                  <FormField control={control} name="heard_of_telehealth" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Have you heard of telehealth/telemedicine before? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Yes", value: "yes" },
                            { label: "No", value: "no" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.heard_of_telehealth && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  {values.heard_of_telehealth === "yes" && (
                    <FormField control={control} name="telehealth_sources" render={({ field }) => (
                      <FormItem className="pl-4 border-l-2 border-primary/20 ml-2 py-2">
                        <FormLabel className="text-base">If yes, from where? (Select all that apply)</FormLabel>
                        <FormControl>
                          <MultiSelectGroup 
                            options={[
                              { label: "Friends/family", value: "friends_family" },
                              { label: "Social media/Internet", value: "social_media" },
                              { label: "Health worker", value: "health_worker" },
                              { label: "TV/Radio", value: "tv_radio" },
                              { label: "Other", value: "other" }
                            ]}
                            value={field.value || []} onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  )}

                  <FormField control={control} name="used_telehealth_before" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Have you ever used any form of telehealth? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Yes", value: "yes" },
                            { label: "No", value: "no" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.used_telehealth_before && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />
                </div>
              )}

              {/* SECTION 6: READINESS & WILLINGNESS */}
              {step === 6 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField control={control} name="willing_to_use_telehealth" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">How willing are you to use telehealth for your healthcare? <span className="text-destructive">*</span></FormLabel>
                      <CardDescription>On a scale of 1 (Strongly unwilling) to 5 (Strongly willing)</CardDescription>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "1 - Strongly unwilling", value: "1" },
                            { label: "2 - Unwilling", value: "2" },
                            { label: "3 - Neutral", value: "3" },
                            { label: "4 - Willing", value: "4" },
                            { label: "5 - Strongly willing", value: "5" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.willing_to_use_telehealth && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  <FormField control={control} name="preferred_telehealth_mode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Preferred mode of telehealth</FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Video call", value: "video_call" },
                            { label: "Phone call", value: "phone_call" },
                            { label: "Chat/messaging", value: "chat_messaging" },
                            { label: "Any of the above", value: "any" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={control} name="preferred_telehealth_use" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What would you use telehealth for? (Select all that apply)</FormLabel>
                      <FormControl>
                        <MultiSelectGroup 
                          options={[
                            { label: "Follow-up/review visits", value: "followup_reviews" },
                            { label: "NCD management (e.g. BP/Sugar checks)", value: "ncd_management" },
                            { label: "Prescription renewal", value: "prescription_renewal" },
                            { label: "General health advice", value: "general_advice" }
                          ]}
                          value={field.value || []} onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={control} name="willing_for_ncd_telecare" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Would you use telehealth for NCD management specifically?</FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Yes", value: "yes" },
                            { label: "No", value: "no" },
                            { label: "Not sure", value: "not_sure" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={control} name="willing_for_followup_telecare" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Would you use telehealth for routine follow-up/review visits?</FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "Yes", value: "yes" },
                            { label: "No", value: "no" },
                            { label: "Not sure", value: "not_sure" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {/* SECTION 7: CONCERNS */}
              {step === 7 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <p className="text-muted-foreground mb-4">Please rate your level of concern for the following on a scale of 1 (Not concerned) to 5 (Very concerned):</p>
                  
                  <FormField control={control} name="privacy_concern" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Privacy and data security <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "1 - Not concerned", value: "1" },
                            { label: "2 - Slightly concerned", value: "2" },
                            { label: "3 - Neutral", value: "3" },
                            { label: "4 - Concerned", value: "4" },
                            { label: "5 - Very concerned", value: "5" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.privacy_concern && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  <FormField control={control} name="technical_difficulty_concern" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Difficulty using the technology <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "1 - Not concerned", value: "1" },
                            { label: "2 - Slightly concerned", value: "2" },
                            { label: "3 - Neutral", value: "3" },
                            { label: "4 - Concerned", value: "4" },
                            { label: "5 - Very concerned", value: "5" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.technical_difficulty_concern && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  <FormField control={control} name="effectiveness_concern" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Effectiveness compared to in-person visits <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <CardRadioGroup 
                          options={[
                            { label: "1 - Not concerned", value: "1" },
                            { label: "2 - Slightly concerned", value: "2" },
                            { label: "3 - Neutral", value: "3" },
                            { label: "4 - Concerned", value: "4" },
                            { label: "5 - Very concerned", value: "5" }
                          ]}
                          value={field.value} onChange={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.effectiveness_concern && <FormMessage>This field is required</FormMessage>}
                    </FormItem>
                  )} />

                  <FormField control={control} name="other_concerns" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Do you have any other concerns? (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Type your concerns here..." className="min-h-[100px] resize-none" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {/* SECTION 8: OPEN-ENDED */}
              {step === 8 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <FormField control={control} name="suggestions" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Any suggestions for making telehealth work better for you? (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Share your ideas..." className="min-h-[150px] resize-none" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              {step > 0 && step < 9 && (
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
                  
                  {step < 8 ? (
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
          AGA Health Foundation • Obuasi Mine
        </div>
      </div>
    </div>
  );
}
