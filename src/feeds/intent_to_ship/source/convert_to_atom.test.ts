import { describe, expect, test } from 'vitest'
import { convertToAtomEntries, uniqueJoinAtomFeedEntries } from './convert_to_atom'

import * as fs from 'fs';
import { ItemClass, Item } from './item';
import { AtomFeed } from '../../modules';

export type TestItemClass = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    guid: string;
}

// convert data.json to ItemClass
function convertToItemClass(json: TestItemClass): ItemClass {
    const item: Item = {
        title: [json.title],
        link: [json.link],
        description: [json.description],
        pubDate: [json.pubDate],
        guid: [{ _: json.guid }]
    }
    return new ItemClass(item);
}

describe('convertToAtomEntries', () => {
    test('should work as expected', () => {
        const data = JSON.parse(fs.readFileSync('./src/feeds/intent_to_ship/source/__fixtures/data.json').toString()) as Array<TestItemClass>;
        const d: Array<ItemClass> = data.map((entry: any) => { return convertToItemClass(entry) })
        const res = convertToAtomEntries(d);
        expect(res).toMatchSnapshot();
    });
});


describe('uniqueJoinAtomFeedEntries', () => {
    test('should work as expected', () => {
        const xmlData = fs.readFileSync('./src/feeds/modules/atom/__fixtures/atom.xml').toString();
        const currentAtom: AtomFeed = AtomFeed.createFromXML(xmlData);

        const uniqueEntries = uniqueJoinAtomFeedEntries(currentAtom, [], { length: 150 })
        expect(uniqueEntries).toMatchSnapshot();
    });
});
