import ProfileSetupForm from "../ProfileSetupForm";

export default function ProfileSetupFormExample() {
  return (
    <ProfileSetupForm
      role="athlete"
      email="john@example.com"
      onSubmit={(profile) => console.log("Profile submitted:", profile)}
      onBack={() => console.log("Back clicked")}
    />
  );
}
