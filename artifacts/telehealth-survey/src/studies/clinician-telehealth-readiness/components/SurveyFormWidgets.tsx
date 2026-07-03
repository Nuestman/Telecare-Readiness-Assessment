import { useId } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export const toApiMultiSelect = (val: string[] | undefined) =>
  val && val.length > 0 ? val.join(",") : null;

export function MultiSelectGroup({
  options,
  value = [],
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const idPrefix = useId();
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <div
          key={opt.value}
          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"
        >
          <Checkbox
            id={`${idPrefix}-${opt.value}`}
            checked={value.includes(opt.value)}
            onCheckedChange={(checked) => {
              if (checked) onChange([...value, opt.value]);
              else onChange(value.filter((v) => v !== opt.value));
            }}
          />
          <Label htmlFor={`${idPrefix}-${opt.value}`} className="cursor-pointer font-medium">
            {opt.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

export function CardRadioGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (val: string) => void;
}) {
  const idPrefix = useId();
  return (
    <RadioGroup onValueChange={onChange} value={value} className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.value}>
          <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} className="peer sr-only" />
          <Label
            htmlFor={`${idPrefix}-${opt.value}`}
            className="flex items-center rounded-md border p-4 shadow-sm cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 font-medium"
          >
            {opt.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export function LikertScale({
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  value?: string;
  onChange: (val: string) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-stretch justify-between gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(String(num))}
            className={`flex-1 rounded-md border p-3 text-center transition-all hover:bg-muted/50 ${
              value === String(num)
                ? "border-primary bg-primary/10 text-primary font-bold"
                : "bg-card"
            }`}
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

export function LikertField({
  name,
  label,
  control,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  minLabel,
  maxLabel,
}: {
  name: string;
  label: string;
  control: unknown;
  FormField: React.ComponentType<any>;
  FormItem: React.ComponentType<any>;
  FormLabel: React.ComponentType<any>;
  FormControl: React.ComponentType<any>;
  FormMessage: React.ComponentType<any>;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }: { field: { value?: string; onChange: (v: string) => void } }) => (
        <FormItem>
          <FormLabel className="text-base">{label}</FormLabel>
          <FormControl>
            <LikertScale
              value={field.value}
              onChange={field.onChange}
              minLabel={minLabel}
              maxLabel={maxLabel}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
