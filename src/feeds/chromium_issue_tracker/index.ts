import fs from 'fs';
import convert from 'xml-js';

import { AtomFeed, AtomEntry } from '../modules/atom/atom';
import { xml2json } from '../modules/xml2json';
import { loadIssueJSON } from '../modules/load-issue-json';

(async () => {
    try {
        const xmlPath = "./feeds/chromium_issue_tracker/atom.xml";
        const atomXML = fs.readFileSync(xmlPath).toString();
        var currentAtom = xml2json(atomXML);

        if (!currentAtom.feed.entry) currentAtom.feed.entry = [];

        const issues = loadIssueJSON("./src/feeds/chromium_issue_tracker/playwright/result.json");

        if (issues.length === 0) {
            console.log('Updates nothing');
            return;
        }

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

        let newAtom: any;
        try {
            newAtom = xml2json(feed.toXML());
        } catch (e) {
            console.error(e);
            console.error(JSON.stringify(feed, null, '  '));
        }

        // If the entry is only one, then the entry becomes object. So to use concat method, we need to convert the object to array.
        if (!Array.isArray(newAtom.feed.entry)) {
            newAtom.feed.entry = [newAtom.feed.entry];
        }

        newAtom.feed.entry = newAtom.feed.entry.map((entry: any) => {
            return { ...entry, content: { _attributes: { type: 'html' }, _text: Buffer.from(entry.content._text, 'base64').toString('utf8') } };
        });

        currentAtom.feed.entry = newAtom.feed.entry.concat(currentAtom.feed.entry).slice(0, 50);
        currentAtom.feed.updated._text = latest.updated;

        let newAtomXML: any;
        try {
            newAtomXML = convert.json2xml(currentAtom, { compact: true, spaces: 4 });
        } catch (e) {
            console.error(e);
            console.log(JSON.stringify(currentAtom, null, '  '));
        }

        console.log(`Contents is written in ${xmlPath}.new`);
        fs.writeFileSync(`${xmlPath}.new`, newAtomXML);
    } catch (e) {
        console.error(e)
    }
})();
