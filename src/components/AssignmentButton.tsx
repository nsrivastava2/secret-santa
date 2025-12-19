'use client'

interface AssignmentButtonProps {
  onClick: () => void
  loading: boolean
  disabled: boolean
}

export default function AssignmentButton({
  onClick,
  loading,
  disabled,
}: AssignmentButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="retro-button flex items-center justify-center gap-3 mx-auto"
    >
      {loading ? (
        <>
          <span className="loading-spinner"></span>
          <span>Revealing...</span>
        </>
      ) : (
        <span>Reveal My Match!</span>
      )}
    </button>
  )
}
