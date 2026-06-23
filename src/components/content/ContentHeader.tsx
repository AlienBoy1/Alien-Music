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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {showFeedback && (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-text-muted sm:inline">
            Beta Feed
          </span>
          <button
            type="button"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
          >
            Give Feedback
          </button>
        </div>
      )}
    </div>
  );
}
