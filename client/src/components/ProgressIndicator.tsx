interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i + 1 === currentStep
              ? "w-8 bg-primary"
              : i + 1 < currentStep
              ? "w-2 bg-primary"
              : "w-2 bg-muted"
          }`}
          data-testid={`progress-step-${i + 1}`}
        />
      ))}
    </div>
  );
}
