import { ItemClass, XMLResponse } from "./item";
import { Result, err, ok } from 'neverthrow';
import { request } from 'undici';
import { parse } from 'node-html-parser';
import { sanitize, sleep } from "../../modules";

const axios = require('axios').default;
const parseStringPromise = require('xml2js').parseStringPromise;

const url = 'https://www.mail-archive.com/blink-dev@chromium.org/maillist.xml';

export type IntentToShip = ItemClass[];

export async function fetchIntentToShip(): Promise<Result<IntentToShip, Error>> {
    try {
        const res = await axios.get(url);
        const data = (await parseStringPromise(res.data)) as XMLResponse;
        let items = data.rss.channel[0].item
            .map(ItemClass.create);
        console.log(`fetched ${items.length} items`);

        const filledItems = [];
        for (const item of items.slice(0, 1)) {
            const description = await fetchDescription(item.link);
            filledItems.push(
                {
                    title: item.title,
                    link: item.link,
                    description: description,
                    pubDate: item.pubDate,
                    guid: item.guid,
                })
            await sleep(250);
        }
        return ok(filledItems);
    } catch (e: unknown) {
        if (e instanceof Error) {
            return err(e);
        }
        return err(new Error("Unknown error"));
    }
}

async function fetchDescription(url: string): Promise<string> {
    const root = parse(await fetchContent(url));
    const head = root.querySelector('.msgHead')?.toString() ?? '';
    const body = root.querySelector('.msgBody')?.toString() ?? '';
    const description = `${head + body}`
    return description;
}

async function fetchContent(url: string): Promise<string> {
    try {
        return (await request(url, { maxRedirections: 3 })).body.text();
    } catch (e) {
        console.error(e);
    }
    return "";
}
