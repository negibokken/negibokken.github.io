import fs from 'fs';
import { fetchIntentToShip } from './source/fetch_intent_to_ship';
import { convertToAtomEntries, uniqueJoinAtomFeedEntries } from './source/convert_to_atom';
import { AtomFeed } from '../modules';
import * as prettier from 'prettier';

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
        const latestAtomFeed = uniqueJoinAtomFeedEntries(currentAtom, latestEntries, { length: 150 });
        try {
            const newAtomXML = latestAtomFeed.toXML();
            console.log(`a file is written in ${xmlPath}.new`);
            const formattedXML = prettier.format(newAtomXML, { parser: 'xml' });
            fs.writeFileSync(`${xmlPath}.new`, formattedXML);
        } catch (e) {
            console.log(latestAtomFeed);
            throw e;
        }
    } catch (e) {
        console.error(e)
    }
})();
