"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  formatPrice,
  groupByCategory,
  searchCatalog,
} from "@/lib/catalog";

/**
 * Catalog search — the header trigger and the command palette it opens.
 *
 * Both live in one component because they share open state, the ⌘K binding,
 * and the focus contract: whatever opened the palette, focus returns to the
 * trigger when it closes.
 *
 * Visual contract: docs/design-system/MASTER.md §7 (Command palette).
 */
/** The platform never changes mid-session, so there is nothing to subscribe to. */
const subscribeToNothing = () => () => {};

export function CatalogSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // The platform is a value that genuinely differs between server and client,
  // which is what useSyncExternalStore's third argument is for: render the
  // non-Mac hint on the server, correct it during hydration, no effect and no
  // mismatch. Reading navigator during render instead would mismatch.
  const isMac = React.useSyncExternalStore(
    subscribeToNothing,
    () => navigator.userAgent.includes("Mac"),
    () => false
  );
  const shortcutHint = isMac ? "⌘K" : "Ctrl K";

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;

      event.preventDefault();
      setOpen((wasOpen) => !wasOpen);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const groups = groupByCategory(searchCatalog(query));

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    // A palette that reopens still holding the last query is a palette that
    // reopens showing stale results.
    if (!nextOpen) setQuery("");
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-11 shrink-0 items-center justify-center gap-2 rounded-md border border-input text-sm text-text-secondary transition-colors duration-[var(--dur-fast)] hover:bg-white/[0.06] hover:text-text-primary sm:w-auto sm:justify-start sm:px-3"
      >
        <SearchIcon className="size-4" aria-hidden="true" />
        {/*
          Below `sm` the trigger collapses to its icon: the row cannot carry the
          label and the shortcut alongside a wordmark, a cart and a menu without
          wrapping the hint mid-word. The name stays in the accessibility tree
          either way — a control announced only as "button" is not a saving.

          The shortcut hint goes with it rather than shrinking. A touch device
          has no Ctrl key to press, so advertising one is noise (MASTER.md §7
          asks for the hint inline on the trigger, not for it at every width).
        */}
        <span className="sr-only sm:not-sr-only">Search</span>
        <kbd className="hud-label ml-2 hidden border border-input px-1.5 py-0.5 sm:inline-block">
          {shortcutHint}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          finalFocus={triggerRef}
          className="p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Search products</DialogTitle>

          <Command shouldFilter={false} className="bg-transparent">
            <CommandInput
              // The popup otherwise takes focus itself and the visitor's first
              // keystroke goes nowhere. Caught in the browser — jsdom reports
              // the query box focused either way.
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search products"
              className="font-mono"
            />

            <CommandList>
              {groups.length === 0 ? (
                <p className="hud-label px-3 py-6">
                  No products match &ldquo;{query.trim()}&rdquo;
                </p>
              ) : (
                groups.map((group) => (
                  <CommandGroup key={group.category} heading={group.category}>
                    {group.entries.map((entry) => (
                      <CommandItem
                        key={entry.id}
                        value={entry.id}
                        onSelect={() => setOpen(false)}
                        className="justify-between"
                      >
                        <span>{entry.name}</span>
                        <span className="tabular text-text-muted">
                          {formatPrice(entry.price)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
