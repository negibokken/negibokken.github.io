import fs from 'fs';
import { AtomEntry, AtomFeed } from '../modules/atom';

import convert from 'xml-js';

import { request } from 'undici';
import { AtomEntryProps } from '../modules/atom/atom';

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

async function fetchContent(url: string): Promise<string> {
    try {
        return (await request(url, { maxRedirections: 3 })).body.text();
    } catch (e) {
        console.error(e);
    }
    return "";
}

async function sleep(time: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), time);
    });
}

(async () => {
    try {
        const xmlPath = "./feeds/chromium_issue_tracker/atom.xml";
        const atomXML = fs.readFileSync(xmlPath).toString();
        var currentAtom = JSON.parse(convert.xml2json(atomXML, { compact: true, spaces: 4 }));

        if (!currentAtom.feed.entry) currentAtom.feed.entry = [];


        console.log('fetching list');
        const listRes = await fetch("https://issues.chromium.org/action/issues/list", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,ja-JP;q=0.8,ja;q=0.7",
                "content-type": "application/json",
            },
            // "body": "[\"status:open\",50,\"created_time:desc\",1,null,[\"157\"]]",
            "body": "[\"status:open\",2,\"created_time:desc\",1,null,[\"157\"]]",
            "method": "POST"
        });


        const formatedResponse = trimPrefix(await listRes.text());
        const json = JSON.parse(formatedResponse)
        const filteredResponses = json[0][1].map((arr: any) => {
            const id = arr[22][1];
            // Maybe the meaning of numbers are below:
            // 1: Bug
            // 2: Feature Request
            // 11: Feature
            const type = arr[22][2][1];
            const title = arr[22][2][5];
            return {
                id, title
            }
        });

        console.log('fetching each issue');
        const entries: AtomEntry[] = [];
        for await (const entry of filteredResponses) {
            const issueRes = await fetch(`https://issues.chromium.org/action/issues/${entry.id}?currentTrackerId=157`, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.9,ja-JP;q=0.8,ja;q=0.7",
                },
                "body": null,
                "method": "GET"
            });

            const formattedIssue = trimPrefix(await issueRes.text());
            const issueJson = JSON.parse(formattedIssue)

            const body = issueJson[0][1][15][19][0];
            const author = issueJson[0][1][21][6][1];
            const createdAt = new Date(Number(issueJson[0][1][3][1]) / 1000);
            const atomentry: AtomEntryProps = {
                author: { name: author },
                content: body ? Buffer.from(body).toString('base64') : "",
                id: entry.id,
                title: entry.title,
                link: `https://issues.chromium.org/issues/${entry.id}`,
                updated: createdAt.toISOString(),
                summary: body.slice(0, 50),
            }
            entries.push(new AtomEntry(atomentry));
            await sleep(250);
        }

        if (entries.length === 0) {
            console.log('Updates nothing');
            return;
        }

        const latest = entries[0];
        const link = 'https://negibokken.github.io/feeds/chromium_issue_tracker/atom.xml'
        const feed = new AtomFeed({ id: link, title: "Chromium issue tracker feed", link, updated: latest.updated, entries });
        const newAtom = JSON.parse(convert.xml2json(feed.toXML(), { compact: true, spaces: 4 }));

        // If the entry is only one, then the entry becomes object. So to use concat method, we need to convert the object to array.
        if (!Array.isArray(newAtom.feed.entry)) {
            newAtom.feed.entry = [newAtom.feed.entry];
        }
        newAtom.feed.entry = newAtom.feed.entry.map((entry: any) => {
            return { ...entry, content: { _attributes: { type: 'html' }, _text: Buffer.from(entry.content._text, 'base64').toString('utf8') } };
        });

        currentAtom.feed.entry = newAtom.feed.entry.concat(currentAtom.feed.entry).slice(0, 50);

        const newAtomXML = convert.json2xml(currentAtom, { compact: true, spaces: 4 });

        console.log(`Contents is written in ${xmlPath}.new`);
        fs.writeFileSync(`${xmlPath}.new`, newAtomXML);
    } catch (e) {
        console.error(e)
    }
})();
