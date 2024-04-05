import fs from 'fs';
import convert from 'xml-js';
import { fetchIntentToShip } from './source/fetch_intent_to_ship';
import { convertToAtomEntries, uniqueJoinAtomFeedEntries } from './source/convert_to_atom';
import { AtomFeed } from '../modules';

(async () => {
    try {
        const xmlPath = "./feeds/intent_to_ship/atom.xml";
        const atomXML = fs.readFileSync(xmlPath).toString();
        const currentAtom: AtomFeed = AtomFeed.createFromXML(atomXML);

        const intentToShipResult = await fetchIntentToShip()
        if (intentToShipResult.isErr()) {
            console.error(intentToShipResult.error);
            return;
        }

        const latestEntries = convertToAtomEntries(intentToShipResult.value);
        console.log(latestEntries)
        // process.exit(1);
        const latestAtomFeed = uniqueJoinAtomFeedEntries(currentAtom, latestEntries, { length: 150 });
        try {
            // To format the XML properly, we need to convert class to JSON and after that convert JSON to XML
            const newAtomJSON = convert.xml2json(latestAtomFeed.toXML());
            const newAtomXML = convert.json2xml(newAtomJSON, { compact: true, spaces: 4 });
            console.log(`Contents is written in ${xmlPath}.new`);
            fs.writeFileSync(`${xmlPath}.new`, newAtomXML);
        } catch (e) {
            console.log(latestAtomFeed);
            throw e;
        }
    } catch (e) {
        console.error(e)
    }
})();
