import { AtomEntry, AtomFeed } from './atom';
import { describe, it, expect } from 'vitest';
import { format } from 'prettier';

describe('Atom', () => {
    it('AtomEntry toXML', () => {
        const entry = new AtomEntry({
            id: 'https://example.com/a',
            title: "title",
            author: {
                name: 'author',
            },
            updated: "2001-02-03T16:05:06Z",
            link: "https://example.com",
            summary: "this is a summary text",
            content: "this is a content of the entry",
        });
        console.log(format(entry.toXML(), { parser: 'xml' }));
        expect(format(entry.toXML(), { parser: 'xml' })).toMatchSnapshot();
    });

    it('AtomFeed toXML', () => {
        const entry = new AtomEntry({
            id: 'https://example.com/a',
            title: "title",
            author: {
                name: 'author',
            },
            updated: "2001-02-03T16:05:06Z",
            link: "https://example.com",
            summary: "this is a summary text",
            content: "this is a content of the entry",
        });
        const feed = new AtomFeed({
            id: 'https://example.com',
            title: 'feed_title',
            link: 'https://example.com',
            updated: "2001-02-03T16:05:06Z",
        });
        feed.appendEntry(entry);
        console.log(format(feed.toXML(), { parser: 'xml' }));
        expect(format(feed.toXML(), { parser: 'xml' })).toMatchSnapshot();
    });
});
