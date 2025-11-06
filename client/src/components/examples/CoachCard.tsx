import CoachCard from "../CoachCard";

export default function CoachCardExample() {
  const sampleCoach = {
    id: "1",
    name: "Michael Thompson",
    email: "michael.thompson@email.com",
    sport: "Soccer",
    location: "Toronto",
    profileImage: null,
  };

  return (
    <div className="max-w-md p-6">
      <CoachCard coach={sampleCoach} />
    </div>
  );
}
