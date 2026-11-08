export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
      <div>
        <h5 className="text-lg font-semibold">{title}</h5>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
