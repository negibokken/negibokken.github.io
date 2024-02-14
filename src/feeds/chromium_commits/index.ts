import fs from 'fs';
import convert from 'xml-js';
import { format } from 'prettier';
import { AtomEntry, AtomFeed } from '../modules/atom';
import { parse } from 'node-html-parser';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

function sanitize(str: string) {
    return str.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&#38;", "&").replaceAll("&#39;", "'").replaceAll("&#34;", "\"")
        .replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("&", "&#38;").replaceAll("'", "&#39;").replaceAll("\"", "&#34;");
}

(async () => {
    try {
        const xmlPath = "./feeds/chromium_commits/atom.xml";
        const atomXML = fs.readFileSync(xmlPath).toString();
        var currentAtom = JSON.parse(convert.xml2json(atomXML, { compact: true, spaces: 4 }));

        let where = {};
        if (!currentAtom.feed.entry) currentAtom.feed.entry = [];
        if (currentAtom.feed.entry.length !== 0) {
            where = {
                where: {
                    commitAt: {
                        gt: new Date(currentAtom.feed.entry[0].updated._text).toISOString(),
                    }
                }
            }
        }

        const res = await prismaClient.commits.findMany({
            select: {
                commit: true,
                title: true,
                commitAt: true,
                message: true,

            },
            orderBy: { commitAt: 'desc' },
            take: 200,
            ...where,
        });

        if (res.length === 0) {
            console.log('Updates nothing');
            return;
        }

        const chromiumBaseURL = "https://chromium.googlesource.com/chromium/src/+/"

        const entries = res.map((entry) => {
            const link = `${chromiumBaseURL}${entry.commit}%5E%21/`
            return new AtomEntry({ id: link, title: sanitize(entry.title ?? ''), author: { name: "Chromium commit feed" }, updated: entry.commitAt.toISOString(), link: link, summary: link, content: Buffer.from((entry.message ?? '').replaceAll("\n", "<br/><br/>")).toString('base64') });
        });

        const latest = entries[0];
        const link = 'https://negibokken.github.io/feeds/chromium_commits/atom.xml'
        const feed = new AtomFeed({ id: link, title: "Chromium commit feed", link, updated: latest.updated, entries });
        const newAtom = JSON.parse(convert.xml2json(feed.toXML(), { compact: true, spaces: 4 }));

        // If the entry is only one, then the entry becomes object. So to use concat method, we need to convert the object to array.
        if (!Array.isArray(newAtom.feed.entry)) {
            newAtom.feed.entry = [newAtom.feed.entry];
        }

        newAtom.feed.entry = newAtom.feed.entry.map((entry: any) => {
            return { ...entry, content: { _attributes: { type: 'html' }, _text: Buffer.from(entry.content._text, 'base64').toString('utf8') } };
        });


        currentAtom.feed.entry = newAtom.feed.entry.concat(currentAtom.feed.entry).slice(0, 200);
        currentAtom.feed.updated._text = latest.updated;

        const newAtomXML = convert.json2xml(currentAtom, { compact: true, spaces: 4 });

        console.log(`Contents is written in ${xmlPath}.new`);
        fs.writeFileSync(`${xmlPath}.new`, newAtomXML);
    } catch (e) {
        console.error(e)
    }
})();
