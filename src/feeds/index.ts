import { PrismaClient } from '@prisma/client';

import fs from 'fs';
import { format } from 'prettier';

import { AtomEntry, AtomFeed } from './atom';

import convert from 'xml-js';

const prismaClient = new PrismaClient();

function sanitize(str: string) {
    return str.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&#38;").replace("'", "&#39;").replace("\"", "&#34;");
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

        const entries = res.map((entry) => {
            return new AtomEntry({ id: entry.guid, title: sanitize(entry.title), author: { name: "Intent to Ship" }, updated: entry.pubDate.toISOString(), link: entry.link, summary: entry.link, content: entry.link });
        });
        const latest = entries[0];
        const link = 'https://negibokken.github.io/feeds/intent_to_ship/atom.xml'
        const feed = new AtomFeed({ id: link, title: "intent to ship feed", link, updated: latest.updated, entries });
        const newAtom = JSON.parse(convert.xml2json(feed.toXML(), { compact: true, spaces: 4 }));

        // If the entry is only one, then the entry becomes object. So to use concat method, we need to convert the object to array.
        if (!Array.isArray(newAtom.feed.entry)) {
            newAtom.feed.entry = [newAtom.feed.entry];
        }
        currentAtom.feed.entry = newAtom.feed.entry.concat(currentAtom.feed.entry);

        const newAtomXML = convert.json2xml(currentAtom, { compact: true, spaces: 4 });

        fs.writeFileSync(`${xmlPath}.new`, JSON.stringify(feed));
    } catch (e) {
        console.error(e)
    }
})();
