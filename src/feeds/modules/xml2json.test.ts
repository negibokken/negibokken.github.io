import { describe, it, expect } from 'vitest';
import { xml2json } from './xml2json';
import fs from 'fs';
import { loadIssueJSON } from './load-issue-json';
import { AtomEntry, AtomFeed } from './atom/atom';

describe('xml2json', () => {
    it('should convert xml to json', () => {
        const issues = loadIssueJSON('src/feeds/modules/__fixtures__/cit-result.json');
        const entries = issues.map((issue) => {
            return new AtomEntry({
                id: issue.id.toString(),
                title: issue.title,
                author: { name: "Chromium issue tracker" },
                updated: issue.updated,
                link: issue.link,
                summary: issue.content,
                content: issue.content
            });
        });
        const latest = issues[0];
        const link = 'https://negibokken.github.io/feeds/chromium_issue_tracker/atom.xml'
        const feed = new AtomFeed({ id: link, title: "Chromium issue tracker feed", link, updated: latest.updated, entries });

        const json = xml2json(feed.toXML());
        expect(json).toMatchSnapshot();
    });
});
