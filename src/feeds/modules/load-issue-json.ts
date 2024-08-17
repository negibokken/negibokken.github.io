import fs from 'fs';
import { CITResult } from './cit-types';

interface IssueJSON {
    id: number;
    title: string;
    link: string;
    updated: string;
    content: string;
}

export function loadIssueJSON<T>(jsonPath: string): Array<IssueJSON> {
    const issueJSON = fs.readFileSync(jsonPath).toString();
    const jsons = JSON.parse(issueJSON) as Array<CITResult>;
    return jsons.map((json: CITResult) => ({
        id: json.id,
        title: `【${json.component}】 ${json.title}`,
        link: json.link,
        updated: json.created,
        content: "Click to view details",
    }));
}
