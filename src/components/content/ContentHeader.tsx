interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  showFeedback?: boolean;
}

export function ContentHeader({
  title,
  subtitle,
  showFeedback = true,
}: ContentHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h1 className="font-display beam-underline text-2xl font-bold tracking-wide md:text-3xl text-alien-gradient">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {showFeedback && (
        <div className="flex items-center gap-3">
          <span className="hidden font-display text-xs tracking-widest text-alien-cyan/60 uppercase sm:inline">
            Beta Feed
          </span>
          <button
            type="button"
            className="alien-btn-primary rounded-full px-5 py-2 text-sm"
          >
            Give Feedback
          </button>
        </div>
      )}
    </div>
  );
}
