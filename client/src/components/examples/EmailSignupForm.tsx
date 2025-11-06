import EmailSignupForm from "../EmailSignupForm";

export default function EmailSignupFormExample() {
  return (
    <EmailSignupForm
      role="athlete"
      onSubmit={(email) => console.log("Email submitted:", email)}
      onBack={() => console.log("Back clicked")}
    />
  );
}
