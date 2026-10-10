import * as React from "react";
import { useTranslation } from "react-i18next";

import type {
  ExerciseCreate,
  ExerciseRead,
  MuscleGroupFactor,
} from "@/api/model";
import { MuscleGroup } from "@/api/model/muscleGroup";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toastError } from "@/lib/errors";
import { Plus, X } from "lucide-react";

const ALL_MUSCLE_GROUPS = Object.values(MuscleGroup);

export interface ExerciseFormHandle {
  /**
   * Builds the payload, or null (after showing a toast) if the form isn't
   * valid yet. The muscle groups are always included, so it doubles as an
   * update payload.
   */
  getPayload: () => ExerciseCreate | null;
}

type SecondaryRow = {
  id: string;
  muscleGroup: MuscleGroup | null;
  factor: string;
};

/** A factor in (0, 1] with at most two decimals, as the backend accepts. */
function parseFactor(value: string): number | null {
  if (!value.trim()) return null;
  const factor = Number(value);
  if (!(factor > 0 && factor <= 1)) return null;
  if (Math.round(factor * 100) / 100 !== factor) return null;
  return factor;
}

/**
 * Name and weighted muscle groups of an exercise, shared by the create and
 * view modals. Pass `exercise` to prefill it for editing.
 */
export const ExerciseForm = ({
  ref,
  exercise,
}: {
  ref?: React.Ref<ExerciseFormHandle>;
  exercise?: ExerciseRead;
}) => {
  const { t } = useTranslation();
  const [name, setName] = React.useState(exercise?.name ?? "");
  const [primary, setPrimary] = React.useState<MuscleGroup | null>(
    exercise?.primary_muscle_group.muscle_group ?? null,
  );
  const [primaryFactor, setPrimaryFactor] = React.useState(
    String(exercise?.primary_muscle_group.factor ?? 1),
  );
  const [secondaries, setSecondaries] = React.useState<SecondaryRow[]>(
    () =>
      exercise?.secondary_muscle_groups.map((secondary) => ({
        id: crypto.randomUUID(),
        muscleGroup: secondary.muscle_group,
        factor: String(secondary.factor),
      })) ?? [],
  );

  const chosen = [primary, ...secondaries.map((row) => row.muscleGroup)];
  /** Muscle groups selectable in a select currently showing `current`. */
  function optionsFor(current: MuscleGroup | null) {
    return ALL_MUSCLE_GROUPS.filter(
      (group) => group === current || !chosen.includes(group),
    );
  }

  function addSecondary() {
    setSecondaries((rows) => [
      ...rows,
      { id: crypto.randomUUID(), muscleGroup: null, factor: "0.5" },
    ]);
  }

  function updateSecondary(id: string, changes: Partial<SecondaryRow>) {
    setSecondaries((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }

  function removeSecondary(id: string) {
    setSecondaries((rows) => rows.filter((row) => row.id !== id));
  }

  React.useImperativeHandle(ref, () => ({
    getPayload: () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toastError(null, t("exercises.validation.missingName"));
        return null;
      }
      if (!primary) {
        toastError(null, t("exercises.validation.missingPrimaryMuscleGroup"));
        return null;
      }

      const parsedPrimaryFactor = parseFactor(primaryFactor);
      if (parsedPrimaryFactor === null) {
        toastError(null, t("exercises.validation.invalidFactor"));
        return null;
      }

      const parsedSecondaries: MuscleGroupFactor[] = [];
      for (const row of secondaries) {
        // Rows without a muscle group are treated as unused and dropped.
        if (!row.muscleGroup) continue;
        const factor = parseFactor(row.factor);
        if (factor === null) {
          toastError(null, t("exercises.validation.invalidFactor"));
          return null;
        }
        if (factor > parsedPrimaryFactor) {
          toastError(null, t("exercises.validation.secondaryExceedsPrimary"));
          return null;
        }
        parsedSecondaries.push({ muscle_group: row.muscleGroup, factor });
      }

      return {
        name: trimmedName,
        primary_muscle_group: {
          muscle_group: primary,
          factor: parsedPrimaryFactor,
        },
        secondary_muscle_groups: parsedSecondaries,
      };
    },
  }));

  return (
    // min-w-0: as a grid item of the dialog, the form would otherwise grow to
    // its rows' unwrapped width and overflow narrow screens.
    <div className="flex flex-col gap-3 min-w-0">
      <Label htmlFor="name-input">{t("common.fields.name")}</Label>
      <Input
        id="name-input"
        value={name}
        onChange={(event) => setName(event.target.value)}
      ></Input>
      <Separator></Separator>
      <Label htmlFor="primary-muscle-group-input">
        {t("exercises.form.primaryMuscleGroup")}
      </Label>
      <MuscleGroupRow
        id="primary-muscle-group-input"
        muscleGroup={primary}
        factor={primaryFactor}
        options={optionsFor(primary)}
        onMuscleGroupChange={setPrimary}
        onFactorChange={setPrimaryFactor}
      />
      <Label>{t("exercises.form.secondaryMuscleGroups")}</Label>
      {secondaries.map((row) => (
        <MuscleGroupRow
          key={row.id}
          muscleGroup={row.muscleGroup}
          factor={row.factor}
          options={optionsFor(row.muscleGroup)}
          onMuscleGroupChange={(muscleGroup) =>
            updateSecondary(row.id, { muscleGroup })
          }
          onFactorChange={(factor) => updateSecondary(row.id, { factor })}
          onRemove={() => removeSecondary(row.id)}
        />
      ))}
      {chosen.length < ALL_MUSCLE_GROUPS.length && (
        <Button variant={"outline"} className="w-full" onClick={addSecondary}>
          <Plus></Plus>
          {t("exercises.form.addMuscleGroup")}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {t("exercises.form.factorHint")}
      </p>
    </div>
  );
};

function MuscleGroupRow({
  id,
  muscleGroup,
  factor,
  options,
  onMuscleGroupChange,
  onFactorChange,
  onRemove,
}: {
  id?: string;
  muscleGroup: MuscleGroup | null;
  factor: string;
  options: MuscleGroup[];
  onMuscleGroupChange: (muscleGroup: MuscleGroup) => void;
  onFactorChange: (factor: string) => void;
  /** Shows a remove button when given. */
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-row gap-2 items-center">
      <Select
        value={muscleGroup ?? ""}
        onValueChange={(value) => onMuscleGroupChange(value as MuscleGroup)}
      >
        <SelectTrigger id={id} className="flex-1 min-w-0">
          {/* The trigger forces `flex` on its value, which can't truncate. */}
          <SelectValue
            className="block! min-w-0 truncate"
            placeholder={t("common.fields.selectMuscleGroup")}
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`common.muscleGroups.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <InputGroup className="w-20 shrink-0">
        <InputGroupAddon>
          <InputGroupText>×</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="number"
          inputMode="decimal"
          min={0.05}
          max={1}
          step={0.05}
          aria-label={t("exercises.form.factor")}
          value={factor}
          onChange={(event) => onFactorChange(event.target.value)}
        />
      </InputGroup>
      {onRemove ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("exercises.form.removeMuscleGroup")}
          onClick={onRemove}
        >
          <X></X>
        </Button>
      ) : (
        // Keeps the factor inputs of all rows aligned.
        <div className="size-8 shrink-0"></div>
      )}
    </div>
  );
}
