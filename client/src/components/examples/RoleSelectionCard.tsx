import RoleSelectionCard from "../RoleSelectionCard";

export default function RoleSelectionCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto p-6">
      <RoleSelectionCard role="athlete" onSelect={(role) => console.log("Selected:", role)} />
      <RoleSelectionCard role="coach" onSelect={(role) => console.log("Selected:", role)} />
    </div>
  );
}
