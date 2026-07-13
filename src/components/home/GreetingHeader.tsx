interface GreetingHeaderProps {
  name: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function GreetingHeader({ name }: GreetingHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">
        {getGreeting()}, {name}!
      </h1>
      <p className="text-muted-foreground">Ready to practice today?</p>
    </div>
  );
}
