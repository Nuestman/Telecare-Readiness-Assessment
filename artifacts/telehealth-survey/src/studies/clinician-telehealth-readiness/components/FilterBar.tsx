import type { ListClinicianSurveysParams } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ClinicianSurveyFilters = ListClinicianSurveysParams;

type FilterBarProps = {
  filters: ClinicianSurveyFilters;
  onChange: (filters: ClinicianSurveyFilters) => void;
  onReset: () => void;
};

export function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="date_from">From date</Label>
        <Input
          id="date_from"
          type="date"
          value={filters.date_from?.slice(0, 10) ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_from: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date_to">To date</Label>
        <Input
          id="date_to"
          type="date"
          value={filters.date_to?.slice(0, 10) ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_to: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Clinical role</Label>
        <Select
          value={filters.clinical_role ?? "all"}
          onValueChange={(v) =>
            onChange({ ...filters, clinical_role: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="medical_officer">Medical officer</SelectItem>
            <SelectItem value="nurse_midwife">Nurse / midwife</SelectItem>
            <SelectItem value="allied_health">Allied health</SelectItem>
            <SelectItem value="other_clinical">Other clinical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Min willingness (1–5)</Label>
        <Select
          value={filters.min_willingness?.toString() ?? "all"}
          onValueChange={(v) =>
            onChange({
              ...filters,
              min_willingness: v === "all" ? undefined : Number(v),
            })
          }
        >
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="department">Department (contains)</Label>
        <Input
          id="department"
          placeholder="e.g. ncd"
          value={filters.department ?? ""}
          onChange={(e) =>
            onChange({ ...filters, department: e.target.value || undefined })
          }
        />
      </div>
      <div className="flex items-end lg:col-span-2">
        <Button variant="outline" className="w-full" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
