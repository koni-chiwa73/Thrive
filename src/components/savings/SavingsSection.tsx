import { useId, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import type {
  Goal,
  GoalDetailsActions,
  SavingsEntry,
  SavingsEntryInput,
} from '../../types/goal'
import { formatDate, formatSignedCurrency } from '../../utils/format'
import { sortSavingsEntries } from '../../utils/savings'
import type { SavingsSummary } from '../../utils/savings'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import IconButton from '../ui/IconButton'
import Modal from '../ui/Modal'
import SavingsEntryForm from './SavingsEntryForm'
import SavingsProgress from './SavingsProgress'

type EntryModalState = null | { mode: 'add' } | { mode: 'edit'; entryId: string }

interface SavingsSectionProps {
  goal: Goal
  summary: SavingsSummary
  actions: GoalDetailsActions
}

export default function SavingsSection({
  goal,
  summary,
  actions,
}: SavingsSectionProps) {
  const headingId = useId()
  const [modal, setModal] = useState<EntryModalState>(null)

  const entries = useMemo(
    () => sortSavingsEntries(goal.savingsEntries),
    [goal.savingsEntries],
  )

  const editingEntry =
    modal?.mode === 'edit'
      ? (goal.savingsEntries.find((entry) => entry.id === modal.entryId) ?? null)
      : null
  const isModalOpen =
    modal?.mode === 'add' || (modal?.mode === 'edit' && editingEntry !== null)

  const deletion = useConfirmAction<SavingsEntry>(
    (entry) => actions.deleteSavingsEntry(goal.id, entry.id),
    "We couldn't delete this entry. Please try again.",
  )

  // Errors are thrown on purpose: the form shows them inline.
  async function handleSubmit(input: SavingsEntryInput) {
    if (modal?.mode === 'edit') {
      await actions.updateSavingsEntry(goal.id, modal.entryId, input)
    } else {
      await actions.addSavingsEntry(goal.id, input)
    }
    setModal(null)
  }

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id={headingId} className="text-sm font-semibold text-ink-900">
          Savings
        </h3>
        <Button
          variant="secondary"
          className="px-3 py-1.5"
          onClick={() => setModal({ mode: 'add' })}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add entry
        </Button>
      </div>

      <SavingsProgress
        summary={summary}
        label={`Savings progress for ${goal.title}`}
        showPercent
      />

      <h4 className="mb-2 mt-5 text-xs font-medium text-ink-500">History</h4>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-300 px-4 py-6 text-center text-sm text-ink-500">
          No savings yet. Add an entry whenever you set money aside.
        </p>
      ) : (
        <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
          {entries.map((entry) => {
            const amountLabel = formatSignedCurrency(entry.amount)
            const dateLabel = formatDate(entry.entryDate)
            return (
              <li key={entry.id} className="flex items-start gap-2 py-2 pl-4 pr-2">
                <div className="min-w-0 flex-1 py-1">
                  <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="font-semibold tabular-nums text-ink-900">
                      {amountLabel}
                    </span>
                    <span className="text-xs text-ink-500">{dateLabel}</span>
                  </p>
                  {entry.note && (
                    <p className="mt-0.5 break-words text-sm text-ink-700">
                      {entry.note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0">
                  <IconButton
                    icon={Pencil}
                    label={`Edit entry: ${amountLabel} on ${dateLabel}`}
                    onClick={() => setModal({ mode: 'edit', entryId: entry.id })}
                  />
                  <IconButton
                    icon={Trash2}
                    tone="danger"
                    label={`Delete entry: ${amountLabel} on ${dateLabel}`}
                    onClick={() => deletion.request(entry)}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit savings entry' : 'Add savings entry'}
        size="sm"
      >
        <SavingsEntryForm
          entry={editingEntry}
          entries={goal.savingsEntries}
          onSubmit={handleSubmit}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        open={deletion.pending !== null}
        title="Delete this entry?"
        message={
          deletion.pending
            ? `Remove the ${formatSignedCurrency(deletion.pending.amount)} entry from ${formatDate(deletion.pending.entryDate)}? Your totals will update.`
            : ''
        }
        confirmLabel="Delete entry"
        busyLabel="Deleting…"
        isBusy={deletion.isBusy}
        error={deletion.error}
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
      />
    </section>
  )
}