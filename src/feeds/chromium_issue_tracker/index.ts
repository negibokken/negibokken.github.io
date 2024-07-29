import fs from 'fs';

import convert from 'xml-js';

import { request } from 'undici';
import { AtomEntryProps, AtomFeed, AtomEntry } from '../modules/atom/atom';
import { CITResult } from './playwright/tests/example.spec';

// Response from the API contains unnecessary symbols so we need to remove them.
function trimPrefix(text: string) {
    const firstRowEndPos = text.indexOf('\n', 0);
    const formatedResponse = text.slice(firstRowEndPos);
    return formatedResponse;
}

function sanitize(str: string) {
    return str.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&#38;", "&").replaceAll("&#39;", "'").replaceAll("&#34;", "\"")
        .replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("&", "&#38;").replaceAll("'", "&#39;").replaceAll("\"", "&#34;");
}

async function sleep(time: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), time);
    });
}

interface IssueJSON {
    id: number;
    title: string;
    link: string;
    updated: string;
    content: string;
}

function loadIssueJSON(): Array<IssueJSON> {
    const jsonPath = "./src/feeds/chromium_issue_tracker/playwright/result.json";
    const issueJSON = fs.readFileSync(jsonPath).toString();
    const jsons = JSON.parse(issueJSON) as Array<CITResult>;
    return jsons.map((json: CITResult) => ({
        id: json.id,
        title: `${json.title} | ${json.component}`,
        link: json.link,
        updated: json.created,
        content: `${json.title} | ${json.component}`,
    }));
}

(async () => {
    try {
        const xmlPath = "./feeds/chromium_issue_tracker/atom.xml";
        const atomXML = fs.readFileSync(xmlPath).toString();
        var currentAtom = JSON.parse(convert.xml2json(atomXML, { compact: true, spaces: 4 }));

        if (!currentAtom.feed.entry) currentAtom.feed.entry = [];

        const issues = loadIssueJSON();

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
            newAtom = JSON.parse(convert.xml2json(feed.toXML(), { compact: true, spaces: 4 }));
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
