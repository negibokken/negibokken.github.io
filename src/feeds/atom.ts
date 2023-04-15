interface AtomEntryProps {
    id: string;
    title: string;
    author: {
        name: string;
    }
    link: string;
    updated: string;
    summary: string;
    content: string;
}

export class AtomEntry {
    _name: string = 'entry';
    id: string;
    title: string;
    author: {
        name: string;
    };
    updated: string;
    link: {
        _attr: {
            href: string;
        }
    };
    summary: string;
    content: string;
    constructor({ id, title, author, updated, link, summary, content }: AtomEntryProps) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.link = {
            _attr: {
                href: link,
            }
        };
        this.updated = updated;
        this.summary = summary;
        this.content = content;
    }

    toXML(): string {
        return transformToXML(this);
    }
}

interface AtomFeedProps {
    id: string;
    title: string;
    link: string;
    updated: string;
    entries?: AtomEntry[];
}

export class AtomFeed {
    _name: string = 'feed';
    id: string;
    title: string;
    link: {
        _attr: {
            href: string;
            rel: string;
        }
    };
    updated: string;
    entries: AtomEntry[];
    _attr: {
        xmlns: string;
    };
    constructor({ id, title, link, updated, entries = [] }: AtomFeedProps) {
        this.id = id;
        this.title = title;
        this.link = {
            _attr: {
                href: link,
                rel: 'self',
            }
        };
        this.updated = updated;
        this.entries = entries;
        this._attr = {
            xmlns: "http://www.w3.org/2005/Atom"
        };
    }

    appendEntry(entry: AtomEntry): void {
        this.entries.push(entry);
    }

    toXML(): string {
        const template = '<?xml version="1.0" encoding="utf-8"?>';
        return template + transformToXML(this);
    }
}

function transformToXML(obj: any): string {
    let attr = "";
    if (typeof obj === 'object' && '_attr' in obj) {
        attr = " " + Object.entries(obj["_attr"]).map(([_key, _value]) => `${_key}="${_value}"`).join(" ");
    }

    // We should close tag if element doesn't have the inner contents.
    const innerContent = Object.entries(obj).filter(([key, value]) => !key.startsWith("_")).length;
    if (!innerContent) {
        return `<${obj._name}${attr} />`;
    }

    let xml = obj._name ? `<${obj._name}${attr}>` : '';

    for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith("_")) continue;
        if (Array.isArray(value)) {
            xml += transformToXML(value);
        } else if (typeof value === 'object') {
            xml += transformToXML({ _name: key, ...value });
        } else {
            xml += `<${key}>${value}</${key}>`;
        }
    }
    xml += obj._name ? `</${obj._name}>` : '';
    return xml;
}
