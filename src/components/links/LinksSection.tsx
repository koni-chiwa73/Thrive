import { useId, useState } from 'react'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import type {
  Goal,
  GoalDetailsActions,
  GoalLink,
  GoalLinkInput,
} from '../../types/goal'
import { getHostname, getLinkLabel, getSafeHref } from '../../utils/links'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import IconButton from '../ui/IconButton'
import Modal from '../ui/Modal'
import LinkForm from './LinkForm'

type LinkModalState = null | { mode: 'add' } | { mode: 'edit'; linkId: string }

interface LinksSectionProps {
  goal: Goal
  actions: GoalDetailsActions
}

export default function LinksSection({ goal, actions }: LinksSectionProps) {
  const headingId = useId()
  const [modal, setModal] = useState<LinkModalState>(null)

  const editingLink =
    modal?.mode === 'edit'
      ? (goal.links.find((link) => link.id === modal.linkId) ?? null)
      : null
  const isModalOpen =
    modal?.mode === 'add' || (modal?.mode === 'edit' && editingLink !== null)

  const deletion = useConfirmAction<GoalLink>(
    (link) => actions.deleteLink(goal.id, link.id),
    "We couldn't delete this link. Please try again.",
  )

  // Errors are thrown on purpose: the form shows them inline.
  async function handleSubmit(input: GoalLinkInput) {
    if (modal?.mode === 'edit') {
      await actions.updateLink(goal.id, modal.linkId, input)
    } else {
      await actions.addLink(goal.id, input)
    }
    setModal(null)
  }

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id={headingId} className="text-sm font-semibold text-ink-900">
          Related links
        </h3>
        <Button
          variant="secondary"
          className="px-3 py-1.5"
          onClick={() => setModal({ mode: 'add' })}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add link
        </Button>
      </div>

      {goal.links.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-300 px-4 py-6 text-center text-sm text-ink-500">
          No links yet. Save a product page, tutorial, or article for this goal.
        </p>
      ) : (
        <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
          {goal.links.map((link) => {
            const href = getSafeHref(link.url)
            const label = getLinkLabel(link)
            return (
              <li key={link.id} className="flex items-start gap-2 py-2 pl-4 pr-2">
                <div className="min-w-0 flex-1 py-1">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-sage-700 underline-offset-2 hover:underline"
                    >
                      <span className="min-w-0 truncate">{label}</span>
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : (
                    // A stored value that isn't a safe web address is never clickable.
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {label}
                    </span>
                  )}
                  {link.title && (
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {getHostname(link.url)}
                    </p>
                  )}
                  {link.note && (
                    <p className="mt-1 break-words text-sm text-ink-700">
                      {link.note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0">
                  <IconButton
                    icon={Pencil}
                    label={`Edit link: ${label}`}
                    onClick={() => setModal({ mode: 'edit', linkId: link.id })}
                  />
                  <IconButton
                    icon={Trash2}
                    tone="danger"
                    label={`Delete link: ${label}`}
                    onClick={() => deletion.request(link)}
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
        title={modal?.mode === 'edit' ? 'Edit link' : 'Add a link'}
        size="sm"
      >
        <LinkForm
          link={editingLink}
          onSubmit={handleSubmit}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        open={deletion.pending !== null}
        title="Delete this link?"
        message={
          deletion.pending
            ? `Remove “${getLinkLabel(deletion.pending)}” from this goal?`
            : ''
        }
        confirmLabel="Delete link"
        busyLabel="Deleting…"
        isBusy={deletion.isBusy}
        error={deletion.error}
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
      />
    </section>
  )
}