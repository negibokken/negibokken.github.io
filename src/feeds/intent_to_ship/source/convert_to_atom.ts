import { IntentToShip } from './fetch_intent_to_ship';
import { AtomEntry, AtomFeed, sanitize } from '../../modules';

const DEFAULT_LENGTH = 150;

export function convertToAtomEntries(intentToShip: IntentToShip): AtomEntry[] {
    const entries = intentToShip.map((entry) => {
        return new AtomEntry({
            id: entry.guid,
            title: entry.title,
            author: { name: "Intent to Ship" },
            updated: entry.pubDate.toISOString(),
            link: entry.link,
            summary: entry.link + " summary",
            content: entry.description
        });
    });
    return entries;
};

export function uniqueJoinAtomFeedEntries(currentAtom: AtomFeed, entries: AtomEntry[], opt?: { length?: number }): AtomFeed {
    const uniqueEntries = entries.filter((entry) => {
        return !currentAtom.entries.some((currentEntry) => {
            return currentEntry.id === entry.id;
        });
    });

    const joinedEntries = [...currentAtom.entries, ...uniqueEntries];
    const slicedEntries = joinedEntries.map((entry) => {
        return new AtomEntry(
            {
                title: sanitize(entry.title ?? ""), author: entry.author,
                summary: sanitize(entry.title),
                id: entry.id,
                link: entry.link._attr.href,
                updated: entry.updated,
                content: sanitize(entry.content._text ?? ""),
            }
        )
    }).reverse().slice(0, opt?.length ?? DEFAULT_LENGTH);

    const atomFeed = new AtomFeed({
        id: currentAtom.id,
        title: currentAtom.title,
        link: currentAtom.link._attr.href,
        updated: new Date().toISOString(),
        entries: slicedEntries
    });
    return atomFeed;
}
