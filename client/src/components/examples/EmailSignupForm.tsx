import EmailSignupForm from "../EmailSignupForm";

export default function EmailSignupFormExample() {
  return (
    <EmailSignupForm
      role="athlete"
      onSubmit={(email, password) => console.log("Signup submitted:", email, password)}
      onBack={() => console.log("Back clicked")}
      onLogin={(email, password) => console.log("Login:", email, password)}
      onVerifyCode={(email, code) => console.log("Verify:", email, code)}
      isLoginPending={false}
      isVerifyPending={false}
      loginStep="credentials"
      loginError={null}
    />
  );
}
