export type XMLResponse = {
    rss: {
        channel: Channel[];
    };
};

export type Channel = {
    item: Item[];
};

export type Item = {
    title: string[];
    link: string[];
    description: string[];
    pubDate: string[];
    guid: {
        _: string;
    }[];
};

export class ItemClass {
    title: string;
    link: string;
    description: string;
    pubDate: Date;
    guid: string;
    constructor(item: Item) {
        this.title = item.title[0];
        this.link = item.link[0];
        this.description = item.description[0];
        this.pubDate = new Date(item.pubDate[0]);
        this.guid = item.guid[0]._;
    }

    static create(item: Item): ItemClass {
        return new ItemClass(item);
    }
}
