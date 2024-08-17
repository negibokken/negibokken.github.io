import convert from 'xml-js';

export function xml2json(atomXML: string): any {
    return JSON.parse(convert.xml2json(atomXML, { compact: true, spaces: 4 }));
}
