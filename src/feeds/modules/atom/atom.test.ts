import { AtomEntry, AtomFeed } from './atom';
import { describe, it, expect } from 'vitest';
import { format } from 'prettier';
import * as fs from 'fs';

describe('AtomEntry.toXML', () => {
    it('should match snapshot', () => {
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
        expect(format(entry.toXML(), { parser: 'xml' })).toMatchSnapshot();
    });


});

describe('AtomFeed.toXML', () => {
    it('should match snapshot', () => {
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
        expect(format(feed.toXML(), { parser: 'xml' })).toMatchSnapshot();
    });
});


describe('AtomFeed.createFromXML', () => {
    it('should match snapshot', () => {
        const xmlData = fs.readFileSync('./src/feeds/modules/atom/__fixtures/atom.xml').toString();
        const currentAtom: AtomFeed = AtomFeed.createFromXML(xmlData);
        expect(currentAtom.toXML()).toMatchSnapshot();
    });
});
