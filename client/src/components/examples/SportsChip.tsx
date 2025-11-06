import { useState } from "react";
import SportsChip from "../SportsChip";

export default function SportsChipExample() {
  const [selected, setSelected] = useState(false);

  return (
    <div className="flex gap-3 p-6">
      <SportsChip
        sport="Running"
        selected={selected}
        onToggle={() => setSelected(!selected)}
      />
      <SportsChip sport="Cycling" selected={false} onToggle={() => {}} />
      <SportsChip sport="Swimming" selected={true} onToggle={() => {}} />
    </div>
  );
}
