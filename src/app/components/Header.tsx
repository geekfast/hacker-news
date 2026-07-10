import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-card-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight">Hacker News</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
