import ProgressIndicator from "../ProgressIndicator";

export default function ProgressIndicatorExample() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Step 1 of 3</p>
        <ProgressIndicator currentStep={1} totalSteps={3} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Step 2 of 3</p>
        <ProgressIndicator currentStep={2} totalSteps={3} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Step 3 of 3</p>
        <ProgressIndicator currentStep={3} totalSteps={3} />
      </div>
    </div>
  );
}
