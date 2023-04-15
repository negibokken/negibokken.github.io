import { PrismaClient } from '@prisma/client';

import fs from 'fs';
import { format } from 'prettier';

import { AtomEntry, AtomFeed } from '../modules/atom';

import convert from 'xml-js';

import { request } from 'undici';
import { parse } from 'node-html-parser';

const prismaClient = new PrismaClient();

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
        const xmlPath = "./feeds/intent_to_ship/atom.xml";
        const atomXML = fs.readFileSync(xmlPath).toString();
        var currentAtom = JSON.parse(convert.xml2json(atomXML, { compact: true, spaces: 4 }));

        let where = {};
        if (currentAtom.feed.entry.length !== 0) {
            where = {
                where: {
                    pubDate: {
                        gt: new Date(currentAtom.feed.entry[0].updated._text).toISOString(),
                    }
                }
            }
        }

        const res = await prismaClient.intents.findMany({
            select: {
                guid: true,
                title: true,
                link: true,
                pubDate: true,
            },
            orderBy: { pubDate: 'desc' },
            take: 30,
            ...where,
        });

        if (res.length === 0) {
            console.log('Updates nothing');
            return;
        }

        let contents = new Map();
        for await (const entry of res) {
            const root = parse(await fetchContent(entry.link));
            const head = root.querySelector('.msgHead')?.toString() ?? '';
            const body = root.querySelector('.msgBody')?.toString() ?? '';
            const description = `${head + body}`
            contents.set(entry.guid, Buffer.from(description).toString('base64'));
            await sleep(250);
        }

        const entries = res.map((entry) => {
            return new AtomEntry({ id: entry.guid, title: sanitize(entry.title), author: { name: "Intent to Ship" }, updated: entry.pubDate.toISOString(), link: entry.link, summary: entry.link + " summary", content: contents.get(entry.guid) ?? entry.link });
        });

        const latest = entries[0];
        const link = 'https://negibokken.github.io/feeds/intent_to_ship/atom.xml'
        const feed = new AtomFeed({ id: link, title: "intent to ship feed", link, updated: latest.updated, entries });
        const newAtom = JSON.parse(convert.xml2json(feed.toXML(), { compact: true, spaces: 4 }));

        // If the entry is only one, then the entry becomes object. So to use concat method, we need to convert the object to array.
        if (!Array.isArray(newAtom.feed.entry)) {
            newAtom.feed.entry = [newAtom.feed.entry];
        }
        newAtom.feed.entry = newAtom.feed.entry.map((entry: any) => {
            return { ...entry, content: { _attributes: { type: 'html' }, _text: Buffer.from(entry.content._text, 'base64').toString('utf8') } };
        });

        currentAtom.feed.entry = newAtom.feed.entry.concat(currentAtom.feed.entry).slice(50);

        const newAtomXML = convert.json2xml(currentAtom, { compact: true, spaces: 4 });

        console.log(`Contents is written in ${xmlPath}.new`);
        fs.writeFileSync(`${xmlPath}.new`, newAtomXML);
    } catch (e) {
        console.error(e)
    }
})();
